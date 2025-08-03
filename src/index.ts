import {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicEventTypes,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  HAP,
  Logging,
  Service
} from 'homebridge';

import axios, { AxiosResponse } from 'axios';

interface SomfyProtectConfig extends AccessoryConfig {
  username: string;
  password: string;
  siteId?: string;
  logUserChanges?: boolean; // Nouvelle option pour activer/désactiver le logging des utilisateurs
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface Site {
  site_id: string;
  label: string;
}

interface AlarmStatus {
  status: string;
  last_action: {
    user_name?: string;
    user_id?: string;
    timestamp: string;
    action_type: string;
  };
}

interface HistoryEvent {
  timestamp: string;
  type: string;
  user: {
    id: string;
    name: string;
  };
  action: string;
  device_type?: string;
}

let hap: HAP;

export = (api: API) => {
  hap = api.hap;
  api.registerAccessory('SomfyProtect', SomfyProtectAccessory);
};

class SomfyProtectAccessory implements AccessoryPlugin {
  private readonly log: Logging;
  private readonly config: SomfyProtectConfig;
  private readonly api: API;

  private informationService: Service;
  private securityService: Service;

  private accessToken?: string;
  private refreshToken?: string;
  private tokenExpiry?: Date;
  private siteId?: string;
  
  // Variables pour tracker les changements d'utilisateur
  private lastUser?: string;
  private lastActionTimestamp?: string;

  constructor(log: Logging, config: SomfyProtectConfig, api: API) {
    this.log = log;
    this.config = config;
    this.api = api;

    this.log.debug('SomfyProtect Plugin Loaded');

    // Service d'information de l'accessoire
    this.informationService = new hap.Service.AccessoryInformation()
      .setCharacteristic(hap.Characteristic.Manufacturer, 'Somfy')
      .setCharacteristic(hap.Characteristic.Model, 'Protect Alarm')
      .setCharacteristic(hap.Characteristic.SerialNumber, 'SP-001');

    // Service de sécurité
    this.securityService = new hap.Service.SecuritySystem(this.config.name);

    this.securityService.getCharacteristic(hap.Characteristic.SecuritySystemCurrentState)
      .on(CharacteristicEventTypes.GET, this.getCurrentState.bind(this));

    this.securityService.getCharacteristic(hap.Characteristic.SecuritySystemTargetState)
      .on(CharacteristicEventTypes.GET, this.getTargetState.bind(this))
      .on(CharacteristicEventTypes.SET, this.setTargetState.bind(this));

    // Initialisation de l'authentification
    this.authenticate().then(() => {
      this.log.info('SomfyProtect plugin initialized successfully');
      // Démarrer la surveillance périodique pour détecter les changements d'utilisateur
      this.startUserMonitoring();
    }).catch(error => {
      this.log.error('Failed to initialize SomfyProtect plugin:', error);
    });
  }

  private async authenticate(): Promise<void> {
    try {
      const response: AxiosResponse<AuthResponse> = await axios.post('https://sso.myfox.me/oauth/oauth', {
        grant_type: 'password',
        username: this.config.username,
        password: this.config.password,
        client_id: 'myfox-android-app'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));

      this.log.debug('Authentication successful');

      // Récupérer les sites disponibles
      await this.getSites();
    } catch (error) {
      this.log.error('Authentication failed:', error);
      throw error;
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response: AxiosResponse<AuthResponse> = await axios.post('https://sso.myfox.me/oauth/oauth', {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: 'myfox-android-app'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));

      this.log.debug('Token refreshed successfully');
    } catch (error) {
      this.log.error('Token refresh failed:', error);
      throw error;
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiry || this.tokenExpiry <= new Date()) {
      if (this.refreshToken) {
        await this.refreshAccessToken();
      } else {
        await this.authenticate();
      }
    }
  }

  private async getSites(): Promise<void> {
    await this.ensureValidToken();

    try {
      const response: AxiosResponse<Site[]> = await axios.get('https://api.myfox.me/v2/client/site', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (response.data.length === 0) {
        throw new Error('No sites found');
      }

      if (this.config.siteId) {
        const site = response.data.find(s => s.site_id === this.config.siteId);
        if (!site) {
          throw new Error(`Site with ID ${this.config.siteId} not found`);
        }
        this.siteId = this.config.siteId;
      } else {
        this.siteId = response.data[0].site_id;
        if (response.data.length > 1) {
          this.log.warn('Multiple sites found. Using the first one. Consider specifying siteId in config.');
          this.log.warn('Available sites:', response.data.map(s => `${s.label} (${s.site_id})`).join(', '));
        }
      }

      this.log.debug(`Using site: ${this.siteId}`);
    } catch (error) {
      this.log.error('Failed to get sites:', error);
      throw error;
    }
  }

  // Nouvelle méthode pour récupérer l'historique des événements et identifier l'utilisateur
  private async getLastUserAction(): Promise<{ userName?: string; timestamp?: string } | null> {
    await this.ensureValidToken();

    if (!this.siteId) {
      return null;
    }

    try {
      // Récupérer l'historique récent des événements
      const response: AxiosResponse<HistoryEvent[]> = await axios.get(
        `https://api.myfox.me/v2/client/site/${this.siteId}/history`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          },
          params: {
            limit: 10, // Récupérer les 10 derniers événements
            types: 'alarm_arm,alarm_disarm,alarm_partial' // Filtrer les événements d'alarme
          }
        }
      );

      // Trouver le dernier événement d'activation/désactivation d'alarme
      const lastAlarmEvent = response.data
        .filter(event => ['alarm_arm', 'alarm_disarm', 'alarm_partial'].includes(event.type))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      if (lastAlarmEvent && lastAlarmEvent.user) {
        return {
          userName: lastAlarmEvent.user.name,
          timestamp: lastAlarmEvent.timestamp
        };
      }

      return null;
    } catch (error) {
      this.log.debug('Failed to get user action history:', error);
      return null;
    }
  }

  // Méthode pour surveiller les changements d'utilisateur
  private startUserMonitoring(): void {
    if (!this.config.logUserChanges) {
      return;
    }

    // Vérifier toutes les 30 secondes s'il y a eu un changement d'utilisateur
    setInterval(async () => {
      try {
        const userAction = await this.getLastUserAction();
        if (userAction && userAction.timestamp !== this.lastActionTimestamp) {
          this.lastUser = userAction.userName;
          this.lastActionTimestamp = userAction.timestamp;
          
          if (userAction.userName) {
            this.log.info(`Alarm state changed by user: ${userAction.userName} at ${userAction.timestamp}`);
          }
        }
      } catch (error) {
        this.log.debug('Error monitoring user changes:', error);
      }
    }, 30000); // 30 secondes
  }

  private async getAlarmStatus(): Promise<AlarmStatus> {
    await this.ensureValidToken();

    if (!this.siteId) {
      throw new Error('No site ID available');
    }

    try {
      const response: AxiosResponse<AlarmStatus> = await axios.get(
        `https://api.myfox.me/v2/client/site/${this.siteId}/security`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      return response.data;
    } catch (error) {
      this.log.error('Failed to get alarm status:', error);
      throw error;
    }
  }

  private async setAlarmStatus(status: string): Promise<void> {
    await this.ensureValidToken();

    if (!this.siteId) {
      throw new Error('No site ID available');
    }

    try {
      await axios.put(
        `https://api.myfox.me/v2/client/site/${this.siteId}/security`,
        { status },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      this.log.info(`Alarm status set to: ${status}`);
      
      // Attendre un peu puis récupérer l'information de l'utilisateur
      setTimeout(async () => {
        try {
          const userAction = await this.getLastUserAction();
          if (userAction && userAction.userName) {
            this.log.info(`Action performed by user: ${userAction.userName}`);
          }
        } catch (error) {
          this.log.debug('Could not retrieve user information:', error);
        }
      }, 2000); // Attendre 2 secondes pour que l'API se mette à jour

    } catch (error) {
      this.log.error('Failed to set alarm status:', error);
      throw error;
    }
  }

  private mapSomfyStateToHomeKit(somfyState: string): number {
    switch (somfyState) {
      case 'disarmed':
        return hap.Characteristic.SecuritySystemCurrentState.DISARMED;
      case 'armed':
        return hap.Characteristic.SecuritySystemCurrentState.AWAY_ARM;
      case 'partial':
        return hap.Characteristic.SecuritySystemCurrentState.STAY_ARM;
      default:
        return hap.Characteristic.SecuritySystemCurrentState.DISARMED;
    }
  }

  private mapHomeKitStateToSomfy(homeKitState: number): string {
    switch (homeKitState) {
      case hap.Characteristic.SecuritySystemTargetState.DISARM:
        return 'disarmed';
      case hap.Characteristic.SecuritySystemTargetState.AWAY_ARM:
        return 'armed';
      case hap.Characteristic.SecuritySystemTargetState.STAY_ARM:
        return 'partial';
      case hap.Characteristic.SecuritySystemTargetState.NIGHT_ARM:
        return 'partial'; // Mapper NIGHT_ARM sur partial
      default:
        return 'disarmed';
    }
  }

  getCurrentState(callback: CharacteristicGetCallback): void {
    this.getAlarmStatus()
      .then(status => {
        const homeKitState = this.mapSomfyStateToHomeKit(status.status);
        this.log.debug(`Current alarm state: ${status.status} (HomeKit: ${homeKitState})`);
        callback(null, homeKitState);
      })
      .catch(error => {
        this.log.error('Error getting current state:', error);
        callback(error);
      });
  }

  getTargetState(callback: CharacteristicGetCallback): void {
    this.getAlarmStatus()
      .then(status => {
        const homeKitState = this.mapSomfyStateToHomeKit(status.status);
        callback(null, homeKitState);
      })
      .catch(error => {
        this.log.error('Error getting target state:', error);
        callback(error);
      });
  }

  setTargetState(value: any, callback: CharacteristicSetCallback): void {
    const somfyState = this.mapHomeKitStateToSomfy(value);
    
    this.setAlarmStatus(somfyState)
      .then(() => {
        // Mettre à jour l'état actuel
        this.securityService.updateCharacteristic(
          hap.Characteristic.SecuritySystemCurrentState,
          value
        );
        callback();
      })
      .catch(error => {
        this.log.error('Error setting target state:', error);
        callback(error);
      });
  }

  getServices(): Service[] {
    return [
      this.informationService,
      this.securityService
    ];
  }
}
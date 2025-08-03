/**
 * Utilitaires de débogage et de test pour le plugin Somfy Protect Enhanced
 */

import { Logging } from 'homebridge';
import axios from 'axios';

export interface TestConfig {
  username: string;
  password: string;
  siteId?: string;
}

export class SomfyProtectTester {
  private log: Logging;
  private config: TestConfig;
  private accessToken?: string;

  constructor(log: Logging, config: TestConfig) {
    this.log = log;
    this.config = config;
  }

  /**
   * Test de l'authentification Somfy Protect
   */
  async testAuthentication(): Promise<boolean> {
    try {
      this.log.info('🔍 Test d\'authentification...');
      
      const response = await axios.post('https://sso.myfox.me/oauth/oauth', {
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
      this.log.info('✅ Authentification réussie');
      this.log.debug(`Token reçu: ${this.accessToken?.substring(0, 20)}...`);
      
      return true;
    } catch (error: any) {
      this.log.error('❌ Échec de l\'authentification:', error.message);
      return false;
    }
  }

  /**
   * Test de récupération des sites
   */
  async testGetSites(): Promise<any[]> {
    if (!this.accessToken) {
      throw new Error('Authentification requise avant de tester les sites');
    }

    try {
      this.log.info('🔍 Test de récupération des sites...');
      
      const response = await axios.get('https://api.myfox.me/v2/client/site', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      this.log.info(`✅ ${response.data.length} site(s) trouvé(s):`);
      response.data.forEach((site: any, index: number) => {
        this.log.info(`  ${index + 1}. ${site.label} (ID: ${site.site_id})`);
      });

      return response.data;
    } catch (error: any) {
      this.log.error('❌ Échec de récupération des sites:', error.message);
      throw error;
    }
  }

  /**
   * Test de récupération du statut de l'alarme
   */
  async testGetAlarmStatus(siteId: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Authentification requise avant de tester le statut');
    }

    try {
      this.log.info(`🔍 Test du statut de l'alarme pour le site ${siteId}...`);
      
      const response = await axios.get(
        `https://api.myfox.me/v2/client/site/${siteId}/security`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      this.log.info(`✅ Statut de l'alarme: ${response.data.status}`);
      this.log.debug('Réponse complète:', JSON.stringify(response.data, null, 2));

      return response.data;
    } catch (error: any) {
      this.log.error('❌ Échec de récupération du statut:', error.message);
      throw error;
    }
  }

  /**
   * Test de récupération de l'historique
   */
  async testGetHistory(siteId: string): Promise<any[]> {
    if (!this.accessToken) {
      throw new Error('Authentification requise avant de tester l\'historique');
    }

    try {
      this.log.info(`🔍 Test de l'historique pour le site ${siteId}...`);
      
      const response = await axios.get(
        `https://api.myfox.me/v2/client/site/${siteId}/history`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          },
          params: {
            limit: 10,
            types: 'alarm_arm,alarm_disarm,alarm_partial'
          }
        }
      );

      this.log.info(`✅ ${response.data.length} événement(s) d'alarme trouvé(s):`);
      response.data.forEach((event: any, index: number) => {
        this.log.info(`  ${index + 1}. ${event.type} par ${event.user?.name || 'Utilisateur inconnu'} le ${event.timestamp}`);
      });

      return response.data;
    } catch (error: any) {
      this.log.error('❌ Échec de récupération de l\'historique:', error.message);
      throw error;
    }
  }

  /**
   * Test complet de toutes les fonctionnalités
   */
  async runFullTest(): Promise<void> {
    this.log.info('🚀 Démarrage du test complet du plugin Somfy Protect Enhanced');
    
    try {
      // Test 1: Authentification
      const authSuccess = await this.testAuthentication();
      if (!authSuccess) {
        throw new Error('Échec de l\'authentification - arrêt des tests');
      }

      // Test 2: Récupération des sites
      const sites = await this.testGetSites();
      if (sites.length === 0) {
        throw new Error('Aucun site trouvé - vérifiez votre compte Somfy Protect');
      }

      // Utiliser le siteId spécifié ou le premier site trouvé
      const targetSiteId = this.config.siteId || sites[0].site_id;
      this.log.info(`🎯 Utilisation du site: ${targetSiteId}`);

      // Test 3: Statut de l'alarme
      await this.testGetAlarmStatus(targetSiteId);

      // Test 4: Historique
      await this.testGetHistory(targetSiteId);

      this.log.info('🎉 Tous les tests ont réussi ! Le plugin devrait fonctionner correctement.');

    } catch (error: any) {
      this.log.error('💥 Échec du test complet:', error.message);
      throw error;
    }
  }
}

/**
 * Utilitaires de débogage pour les logs
 */
export class DebugLogger {
  private log: Logging;
  private debugEnabled: boolean;

  constructor(log: Logging, debugEnabled: boolean = false) {
    this.log = log;
    this.debugEnabled = debugEnabled;
  }

  debug(message: string, ...args: any[]): void {
    if (this.debugEnabled) {
      this.log.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    this.log.info(`[INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log.error(`[ERROR] ${message}`, ...args);
  }

  logUserAction(userName: string, action: string, timestamp: string): void {
    this.log.info(`👤 Action utilisateur: ${userName} a ${action} l'alarme le ${new Date(timestamp).toLocaleString('fr-FR')}`);
  }

  logStateChange(fromState: string, toState: string): void {
    this.log.info(`🔄 Changement d'état: ${fromState} → ${toState}`);
  }

  logApiCall(method: string, url: string, success: boolean): void {
    const status = success ? '✅' : '❌';
    this.debug(`${status} API ${method} ${url}`);
  }
}

/**
 * Validation de la configuration
 */
export class ConfigValidator {
  static validate(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Vérification des champs obligatoires
    if (!config.username || typeof config.username !== 'string') {
      errors.push('Le champ "username" est obligatoire et doit être une chaîne de caractères');
    }

    if (!config.password || typeof config.password !== 'string') {
      errors.push('Le champ "password" est obligatoire et doit être une chaîne de caractères');
    }

    if (!config.name || typeof config.name !== 'string') {
      errors.push('Le champ "name" est obligatoire et doit être une chaîne de caractères');
    }

    // Vérification des champs optionnels
    if (config.siteId && typeof config.siteId !== 'string') {
      errors.push('Le champ "siteId" doit être une chaîne de caractères');
    }

    if (config.logUserChanges !== undefined && typeof config.logUserChanges !== 'boolean') {
      errors.push('Le champ "logUserChanges" doit être un booléen');
    }

    // Validation du format email
    if (config.username && !this.isValidEmail(config.username)) {
      errors.push('Le champ "username" doit être une adresse email valide');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * Gestionnaire d'erreurs personnalisé
 */
export class ErrorHandler {
  private log: Logging;

  constructor(log: Logging) {
    this.log = log;
  }

  handleAuthError(error: any): void {
    if (error.response?.status === 401) {
      this.log.error('🔐 Erreur d\'authentification: Vérifiez vos identifiants Somfy Protect');
    } else if (error.response?.status === 403) {
      this.log.error('🚫 Accès refusé: Votre compte n\'a pas les permissions nécessaires');
    } else if (error.response?.status === 429) {
      this.log.error('⏱️ Limite de taux atteinte: Trop de requêtes, veuillez patienter');
    } else {
      this.log.error('❌ Erreur d\'authentification:', error.message);
    }
  }

  handleApiError(error: any, context: string): void {
    if (error.response?.status === 500) {
      this.log.error(`🔧 Erreur serveur Somfy (${context}): Le service est temporairement indisponible`);
    } else if (error.response?.status === 404) {
      this.log.error(`🔍 Ressource non trouvée (${context}): Vérifiez votre siteId`);
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      this.log.error(`🌐 Erreur de connexion (${context}): Vérifiez votre connexion Internet`);
    } else {
      this.log.error(`❌ Erreur API (${context}):`, error.message);
    }
  }
}

/**
 * Script de test autonome
 */
export async function runTestScript(): Promise<void> {
  const mockLog = {
    debug: (...args: any[]) => console.log('[DEBUG]', ...args),
    info: (...args: any[]) => console.log('[INFO]', ...args),
    warn: (...args: any[]) => console.log('[WARN]', ...args),
    error: (...args: any[]) => console.log('[ERROR]', ...args)
  } as Logging;

  const config: TestConfig = {
    username: process.env.SOMFY_USERNAME || '',
    password: process.env.SOMFY_PASSWORD || '',
    siteId: process.env.SOMFY_SITE_ID
  };

  if (!config.username || !config.password) {
    console.log('❌ Variables d\'environnement requises:');
    console.log('   SOMFY_USERNAME=votre.email@somfy.fr');
    console.log('   SOMFY_PASSWORD=votre-mot-de-passe');
    console.log('   SOMFY_SITE_ID=votre-site-id (optionnel)');
    process.exit(1);
  }

  const tester = new SomfyProtectTester(mockLog, config);
  await tester.runFullTest();
}
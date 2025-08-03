# Guide d'installation et de migration

## Installation du plugin enhanced

### 1. Désinstallation de l'ancien plugin (si applicable)

Si vous avez déjà installé `homebridge-somfy-protect`, désinstallez-le d'abord :

```bash
# Via npm
npm uninstall -g homebridge-somfy-protect

# Via Homebridge Config UI X
# Allez dans Plugins > Installed > homebridge-somfy-protect > Uninstall
```

### 2. Installation du nouveau plugin

#### Via Homebridge Config UI X (Recommandé)
1. Ouvrez l'interface web de Homebridge Config UI X
2. Allez dans l'onglet "Plugins"
3. Recherchez "homebridge-somfy-protect-enhanced"
4. Cliquez sur "Install"
5. Redémarrez Homebridge

#### Via npm
```bash
npm install -g homebridge-somfy-protect-enhanced
```

### 3. Configuration

#### Migration depuis l'ancien plugin
Si vous migrez depuis `homebridge-somfy-protect`, votre configuration existante continuera de fonctionner :

```json
{
  "accessory": "SomfyProtect",
  "name": "Somfy Protect",
  "username": "votre.email@somfy.fr",
  "password": "votre-mot-de-passe",
  "siteId": "votre-site-id"
}
```

#### Nouvelle configuration avec suivi utilisateur
```json
{
  "accessory": "SomfyProtect",
  "name": "Somfy Protect",
  "username": "votre.email@somfy.fr",
  "password": "votre-mot-de-passe",
  "siteId": "votre-site-id",
  "logUserChanges": true
}
```

## Test de la configuration

### Test automatique
Utilisez le script de test inclus pour vérifier votre configuration :

```bash
# Définir les variables d'environnement
export SOMFY_USERNAME="votre.email@somfy.fr"
export SOMFY_PASSWORD="votre-mot-de-passe"
export SOMFY_SITE_ID="votre-site-id"  # optionnel

# Exécuter le test
node -e "
const { runTestScript } = require('homebridge-somfy-protect-enhanced/dist/utils');
runTestScript().catch(console.error);
"
```

### Test manuel
1. Redémarrez Homebridge
2. Vérifiez les logs pour les messages de succès :
   ```
   [Somfy Protect] SomfyProtect plugin initialized successfully
   [Somfy Protect] Using site: votre-site-id
   ```
3. Testez l'accessoire dans l'app Home d'Apple

## Dépannage de l'installation

### Erreur: Module not found
```bash
# Nettoyer le cache npm
npm cache clean --force

# Réinstaller
npm install -g homebridge-somfy-protect-enhanced

# Redémarrer Homebridge
sudo systemctl restart homebridge
```

### Erreur: Permission denied
```bash
# Sur Linux/macOS
sudo npm install -g homebridge-somfy-protect-enhanced

# Ou configurer npm pour ne pas utiliser sudo
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Plugin non détecté par Homebridge
1. Vérifiez que le plugin est bien installé :
   ```bash
   npm list -g homebridge-somfy-protect-enhanced
   ```

2. Vérifiez la configuration dans `config.json` :
   ```json
   {
     "accessories": [
       {
         "accessory": "SomfyProtect",
         "name": "Somfy Protect",
         "username": "...",
         "password": "..."
       }
     ]
   }
   ```

3. Redémarrez Homebridge complètement

### Problèmes de connectivité
```bash
# Tester la connectivité à l'API Somfy
curl -s "https://sso.myfox.me/oauth/oauth" > /dev/null && echo "API accessible" || echo "API inaccessible"

# Vérifier les DNS
nslookup api.myfox.me
```

## Migration des données

### Préservation des accessoires HomeKit
Lors de la migration, vos accessoires HomeKit existants seront préservés si vous gardez le même `name` dans la configuration.

### Sauvegarde de la configuration
Avant la migration, sauvegardez votre configuration :

```bash
# Sauvegarder la configuration Homebridge
cp ~/.homebridge/config.json ~/.homebridge/config.json.backup

# Sauvegarder les accessoires cachés
cp -r ~/.homebridge/persist ~/.homebridge/persist.backup
```

### Restauration en cas de problème
Si vous rencontrez des problèmes, vous pouvez revenir à l'ancien plugin :

```bash
# Désinstaller le nouveau plugin
npm uninstall -g homebridge-somfy-protect-enhanced

# Réinstaller l'ancien plugin
npm install -g homebridge-somfy-protect

# Restaurer la configuration
cp ~/.homebridge/config.json.backup ~/.homebridge/config.json

# Redémarrer Homebridge
sudo systemctl restart homebridge
```

## Vérification post-installation

### 1. Vérifier les logs
```bash
# Logs Homebridge en temps réel
tail -f ~/.homebridge/homebridge.log

# Ou via systemd (Linux)
journalctl -u homebridge -f
```

### 2. Tester les fonctionnalités

#### Test de base
1. Ouvrez l'app Home d'Apple
2. Trouvez l'accessoire "Somfy Protect"
3. Testez l'activation/désactivation de l'alarme

#### Test du suivi utilisateur
1. Activez `logUserChanges: true` dans la configuration
2. Changez l'état de l'alarme depuis l'app Somfy Protect
3. Vérifiez les logs pour voir le nom de l'utilisateur :
   ```
   [Somfy Protect] Alarm state changed by user: Jean Dupont at 2025-08-03T14:30:25.000Z
   ```

### 3. Performance et stabilité
- Surveillez l'utilisation mémoire de Homebridge
- Vérifiez que les réponses de l'accessoire sont rapides
- Testez après un redémarrage du système

## Mise à jour du plugin

### Mise à jour automatique (Config UI X)
1. Allez dans Plugins > Installed
2. Cliquez sur "Update" si disponible
3. Redémarrez Homebridge

### Mise à jour manuelle
```bash
# Mettre à jour vers la dernière version
npm update -g homebridge-somfy-protect-enhanced

# Ou forcer une réinstallation
npm uninstall -g homebridge-somfy-protect-enhanced
npm install -g homebridge-somfy-protect-enhanced
```

### Vérifier la version installée
```bash
npm list -g homebridge-somfy-protect-enhanced
```

## Monitoring et maintenance

### Logs de débogage
Activez les logs de débogage pour le diagnostic :

```json
{
  "bridge": {
    "name": "Homebridge",
    "username": "...",
    "port": 51826,
    "pin": "031-45-154"
  },
  "accessories": [...],
  "platforms": [...],
  "disablePlugins": [],
  "debug": true
}
```

### Surveillance des performances
Surveillez les métriques importantes :

```bash
# Utilisation mémoire de Homebridge
ps aux | grep homebridge

# Logs d'erreurs récents
grep -i error ~/.homebridge/homebridge.log | tail -20

# Temps de réponse de l'API Somfy
time curl -s "https://api.myfox.me/v2/client/site" > /dev/null
```

### Maintenance préventive

#### Rotation des logs
```bash
# Archiver les anciens logs
mkdir -p ~/.homebridge/logs/archive
mv ~/.homebridge/homebridge.log ~/.homebridge/logs/archive/homebridge-$(date +%Y%m%d).log

# Redémarrer pour créer un nouveau log
sudo systemctl restart homebridge
```

#### Nettoyage périodique
```bash
# Nettoyer le cache npm
npm cache clean --force

# Mettre à jour les dépendances
npm update -g

# Vérifier l'intégrité du plugin
npm list -g homebridge-somfy-protect-enhanced
```

## Problèmes connus et solutions

### 1. Token d'authentification expiré
**Symptôme** : Erreurs 401 dans les logs
```
[Somfy Protect] Authentication failed: Error 401
```

**Solution** :
- Le plugin gère automatiquement le renouvellement des tokens
- Si le problème persiste, vérifiez vos identifiants
- Redémarrez Homebridge pour forcer une nouvelle authentification

### 2. API Somfy indisponible
**Symptôme** : Erreurs de connectivité
```
[Somfy Protect] Failed to get alarm status: Network Error
```

**Solutions** :
- Vérifiez votre connexion Internet
- Consultez le statut de l'API Somfy : https://status.somfy.com
- Attendez et réessayez plus tard

### 3. Multiples sites détectés
**Symptôme** : Plugin utilise le mauvais site
```
[Somfy Protect] Multiple sites found. Using the first one.
```

**Solution** :
```json
{
  "accessory": "SomfyProtect",
  "name": "Somfy Protect",
  "username": "...",
  "password": "...",
  "siteId": "ID-DU-SITE-CORRECT"
}
```

### 4. Suivi utilisateur ne fonctionne pas
**Symptôme** : Pas d'informations utilisateur dans les logs

**Solutions** :
1. Vérifiez que `logUserChanges: true`
2. Attendez jusqu'à 30 secondes après un changement d'état
3. Vérifiez les permissions de votre compte Somfy

### 5. HomeKit ne répond pas
**Symptôme** : L'accessoire apparaît "Non disponible" dans Home

**Solutions** :
1. Redémarrez l'app Home
2. Vérifiez que Homebridge fonctionne : `systemctl status homebridge`
3. Supprimez et re-ajoutez le bridge Homebridge dans Home
4. Vérifiez la connectivité réseau entre votre appareil et Homebridge

## Scripts d'automatisation

### Script de démarrage automatique
Créez un script pour démarrer Homebridge automatiquement :

```bash
#!/bin/bash
# ~/start-homebridge.sh

echo "Démarrage de Homebridge avec Somfy Protect Enhanced..."

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
    echo "Erreur: Node.js n'est pas installé"
    exit 1
fi

# Vérifier que le plugin est installé
if ! npm list -g homebridge-somfy-protect-enhanced &> /dev/null; then
    echo "Installation du plugin Somfy Protect Enhanced..."
    npm install -g homebridge-somfy-protect-enhanced
fi

# Démarrer Homebridge
echo "Démarrage de Homebridge..."
homebridge -D -P ~/.homebridge

# Rendre le script exécutable :
# chmod +x ~/start-homebridge.sh
```

### Script de test de connectivité
```bash
#!/bin/bash
# ~/test-somfy-connectivity.sh

echo "Test de connectivité Somfy Protect..."

# Test de base de l'API
if curl -s --fail "https://api.myfox.me" > /dev/null; then
    echo "✅ API Somfy accessible"
else
    echo "❌ API Somfy inaccessible"
    exit 1
fi

# Test du serveur d'authentification
if curl -s --fail "https://sso.myfox.me" > /dev/null; then
    echo "✅ Serveur d'authentification accessible"
else
    echo "❌ Serveur d'authentification inaccessible"
    exit 1
fi

echo "🎉 Tous les tests de connectivité ont réussi"
```

### Script de sauvegarde automatique
```bash
#!/bin/bash
# ~/backup-homebridge.sh

BACKUP_DIR="$HOME/homebridge-backups"
DATE=$(date +%Y%m%d-%H%M%S)

echo "Création d'une sauvegarde Homebridge..."

# Créer le dossier de sauvegarde
mkdir -p "$BACKUP_DIR"

# Sauvegarder la configuration
cp ~/.homebridge/config.json "$BACKUP_DIR/config-$DATE.json"

# Sauvegarder les données persistantes
cp -r ~/.homebridge/persist "$BACKUP_DIR/persist-$DATE"

# Sauvegarder les logs récents
cp ~/.homebridge/homebridge.log "$BACKUP_DIR/homebridge-$DATE.log"

echo "✅ Sauvegarde créée dans $BACKUP_DIR"

# Nettoyer les anciennes sauvegardes (garder seulement les 7 dernières)
find "$BACKUP_DIR" -name "config-*" -mtime +7 -delete
find "$BACKUP_DIR" -name "persist-*" -mtime +7 -exec rm -rf {} \;
find "$BACKUP_DIR" -name "homebridge-*" -mtime +7 -delete

# Ajouter à la crontab pour exécution quotidienne :
# crontab -e
# 0 2 * * * /home/pi/backup-homebridge.sh
```

## Configuration avancée

### Multi-instances
Pour gérer plusieurs instances Homebridge avec des configurations différentes :

```bash
# Instance principale
homebridge -U ~/.homebridge-main

# Instance secondaire pour Somfy
homebridge -U ~/.homebridge-somfy -P ~/.homebridge-somfy
```

Configuration pour l'instance secondaire (`~/.homebridge-somfy/config.json`) :
```json
{
  "bridge": {
    "name": "Homebridge Somfy",
    "username": "CC:22:3D:E3:CE:31",
    "port": 51827,
    "pin": "031-45-155"
  },
  "accessories": [
    {
      "accessory": "SomfyProtect",
      "name": "Somfy Protect",
      "username": "votre.email@somfy.fr",
      "password": "votre-mot-de-passe",
      "logUserChanges": true
    }
  ]
}
```

### Proxy et pare-feu
Si vous utilisez un proxy ou avez des restrictions réseau :

```json
{
  "accessory": "SomfyProtect",
  "name": "Somfy Protect",
  "username": "...",
  "password": "...",
  "proxy": {
    "host": "proxy.example.com",
    "port": 8080,
    "auth": {
      "username": "proxy-user",
      "password": "proxy-pass"
    }
  }
}
```

### Intégration avec Home Assistant
Si vous utilisez aussi Home Assistant, vous pouvez exposer l'accessoire Homebridge :

```yaml
# configuration.yaml de Home Assistant
homekit:
  - filter:
      include_entities:
        - alarm_control_panel.somfy_protect
```

## Support et communauté

### Obtenir de l'aide
1. **Documentation** : Consultez d'abord ce guide et le README
2. **Issues GitHub** : Signalez les bugs sur le repository GitHub
3. **Logs détaillés** : Incluez toujours les logs complets (sans mots de passe)
4. **Configuration anonymisée** : Partagez votre config sans informations sensibles

### Contribuer au projet
1. **Fork** le repository
2. **Testez** vos modifications
3. **Documentez** les nouvelles fonctionnalités
4. **Soumettez** une Pull Request

### Communauté Homebridge
- **Discord** : Serveur Discord officiel Homebridge
- **Reddit** : r/Homebridge
- **Forum** : Forum officiel Homebridge

## Annexes

### A. Codes d'état Somfy Protect
| État Somfy | État HomeKit | Description |
|------------|--------------|-------------|
| `disarmed` | DISARMED (3) | Alarme désactivée |
| `armed` | AWAY_ARM (1) | Armement total |
| `partial` | STAY_ARM (0) | Armement partiel |

### B. Endpoints API utilisés
- `POST https://sso.myfox.me/oauth/oauth` - Authentification
- `GET https://api.myfox.me/v2/client/site` - Liste des sites
- `GET https://api.myfox.me/v2/client/site/{id}/security` - État alarme
- `PUT https://api.myfox.me/v2/client/site/{id}/security` - Modifier alarme
- `GET https://api.myfox.me/v2/client/site/{id}/history` - Historique

### C. Variables d'environnement
```bash
# Variables pour les tests
export SOMFY_USERNAME="votre.email@somfy.fr"
export SOMFY_PASSWORD="votre-mot-de-passe"
export SOMFY_SITE_ID="optionnel"

# Variables pour le développement
export HOMEBRIDGE_DEBUG=1
export NODE_ENV=development
```

Cette documentation complète devrait vous permettre d'installer, configurer et maintenir le plugin Somfy Protect Enhanced avec succès. N'hésitez pas à consulter les logs et à utiliser les scripts de test pour diagnostiquer tout problème.
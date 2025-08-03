# Homebridge Somfy Protect Enhanced

Plugin Homebridge non officiel pour intégrer le système de sécurité Somfy Protect avec HomeKit, incluant le suivi des utilisateurs qui activent/désactivent l'alarme.

## Nouvelles fonctionnalités

### 🆕 Suivi des utilisateurs
- **Identification automatique** : Le plugin identifie automatiquement quel utilisateur a activé ou désactivé l'alarme
- **Logging détaillé** : Affiche dans les logs Homebridge le nom de l'utilisateur et l'horodatage de l'action
- **Surveillance en temps réel** : Surveille les changements toutes les 30 secondes pour détecter les nouvelles actions

### 🔧 Améliorations techniques
- **Gestion améliorée des tokens** : Renouvellement automatique des tokens d'authentification
- **Meilleure gestion d'erreurs** : Messages d'erreur plus détaillés et gestion robuste des pannes réseau
- **API mise à jour** : Utilisation des derniers endpoints de l'API Myfox/Somfy Protect
- **Support multi-sites** : Gestion améliorée des comptes avec plusieurs maisons

## Installation

### Via Homebridge Config UI X (Recommandé)
1. Ouvrez l'interface web de Homebridge Config UI X
2. Allez dans l'onglet "Plugins"
3. Recherchez "homebridge-somfy-protect-enhanced"
4. Cliquez sur "Install"

### Installation manuelle
```bash
npm install -g homebridge-somfy-protect-enhanced
```

## Configuration

### Configuration de base
Ajoutez la configuration suivante dans le tableau `accessories` de votre fichier `config.json` Homebridge :

```json
{
  "accessory": "SomfyProtect",
  "name": "Somfy Protect",
  "username": "mon.email@somfy.fr",
  "password": "mon.mot.de.passe.somfy"
}
```

### Configuration avancée avec suivi des utilisateurs
```json
{
  "accessory": "SomfyProtect",
  "name": "Somfy Protect",
  "username": "mon.email@somfy.fr",
  "password": "mon.mot.de.passe.somfy",
  "siteId": "votre-site-id-optionnel",
  "logUserChanges": true
}
```

### Paramètres de configuration

| Paramètre | Type | Requis | Défaut | Description |
|-----------|------|---------|---------|-------------|
| `accessory` | string | ✅ | - | Doit être "SomfyProtect" |
| `name` | string | ✅ | - | Nom de l'accessoire dans HomeKit |
| `username` | string | ✅ | - | Email de votre compte Somfy Protect |
| `password` | string | ✅ | - | Mot de passe de votre compte Somfy Protect |
| `siteId` | string | ❌ | Premier site trouvé | ID du site si vous avez plusieurs maisons |
| `logUserChanges` | boolean | ❌ | `true` | Active le suivi des utilisateurs |

## Fonctionnement du suivi des utilisateurs

### Comment ça marche
1. **Authentification** : Le plugin s'authentifie avec votre compte Somfy Protect
2. **Surveillance** : Toutes les 30 secondes, le plugin vérifie l'historique des événements récents
3. **Détection** : Quand un changement d'état d'alarme est détecté, le plugin identifie l'utilisateur responsable
4. **Logging** : L'information est affichée dans les logs Homebridge

### Exemples de logs
```
[Somfy Protect] Alarm state changed by user: Jean Dupont at 2025-08-03T14:30:25.000Z
[Somfy Protect] Action performed by user: Marie Martin
[Somfy Protect] Alarm status set to: armed
```

### États d'alarme supportés
- **Désarmée** (`disarmed`) : L'alarme est complètement désactivée
- **Armée totale** (`armed`) : Toute la maison est protégée
- **Armée partielle** (`partial`) : Protection partielle (mode nuit ou présence)

## Résolution des problèmes

### Problèmes d'authentification
```
[Somfy Protect] Authentication failed: Error 401
```
**Solution** : Vérifiez vos identifiants Somfy Protect et assurez-vous qu'ils fonctionnent dans l'application officielle.

### Plusieurs sites détectés
```
[Somfy Protect] Multiple sites found. Using the first one. Consider specifying siteId in config.
[Somfy Protect] Available sites: Maison principale (abc123), Résidence secondaire (def456)
```
**Solution** : Ajoutez le paramètre `siteId` dans votre configuration avec l'ID du site souhaité.

### Le suivi des utilisateurs ne fonctionne pas
```
[Somfy Protect] Failed to get user action history: Error 403
```
**Solutions** :
1. Vérifiez que votre compte a les permissions nécessaires
2. Désactivez temporairement `logUserChanges` en le définissant sur `false`
3. Redémarrez Homebridge après avoir modifié la configuration

### Erreurs de réseau
```
[Somfy Protect] Failed to get alarm status: Network Error
```
**Solutions** :
1. Vérifiez votre connexion Internet
2. Vérifiez que l'API Somfy Protect n'est pas en maintenance
3. Redémarrez Homebridge

## Développement

### Prérequis
- Node.js 14.18.1 ou supérieur
- Homebridge 1.3.0 ou supérieur

### Installation pour développement
```bash
git clone https://github.com/your-username/homebridge-somfy-protect-enhanced.git
cd homebridge-somfy-protect-enhanced
npm install
npm run build
npm link
```

### Commandes utiles
```bash
# Compilation TypeScript
npm run build

# Surveillance des changements (développement)
npm run watch

# Vérification du code
npm run lint
```

## API et Endpoints

Le plugin utilise l'API Myfox/Somfy Protect avec les endpoints suivants :

### Authentification
- `POST https://sso.myfox.me/oauth/oauth` - Authentification initiale
- `POST https://sso.myfox.me/oauth/oauth` - Renouvellement de token

### Gestion des sites et alarmes
- `GET https://api.myfox.me/v2/client/site` - Liste des sites
- `GET https://api.myfox.me/v2/client/site/{siteId}/security` - État de l'alarme
- `PUT https://api.myfox.me/v2/client/site/{siteId}/security` - Modification de l'état

### Historique (nouvelle fonctionnalité)
- `GET https://api.myfox.me/v2/client/site/{siteId}/history` - Historique des événements

## Changelog

### Version 1.2.0 (Nouvelle version avec suivi utilisateur)
- ✅ Ajout du suivi des utilisateurs qui activent/désactivent l'alarme
- ✅ Surveillance automatique des changements toutes les 30 secondes
- ✅ Logging détaillé des actions utilisateur
- ✅ Gestion améliorée des tokens d'authentification
- ✅ Meilleure gestion d'erreurs et debugging
- ✅ Support amélioré des comptes multi-sites
- ✅ Mise à jour des dépendances et compatibilité Node.js 14+

### Version 1.1.2 (Version originale)
- Intégration de base avec Somfy Protect
- Support des états armé/désarmé/partiel
- Configuration via username/password

## Sécurité et confidentialité

### Protection des données
- **Stockage local uniquement** : Les tokens d'authentification sont stockés uniquement en mémoire
- **Pas de transmission tierce** : Aucune donnée n'est envoyée à des services tiers
- **API officielle** : Utilise uniquement l'API officielle Somfy Protect/Myfox

### Recommandations de sécurité
1. **Utilisez un compte dédié** : Créez un compte Somfy Protect spécifique pour Homebridge si possible
2. **Mots de passe forts** : Utilisez un mot de passe robuste pour votre compte Somfy
3. **Surveillance des logs** : Surveillez les logs pour détecter toute activité suspecte

## Limitations connues

### Limitations de l'API Myfox
- **Délai de mise à jour** : L'API peut prendre jusqu'à 30 secondes pour refléter les changements d'état
- **Limite de requêtes** : L'API a des limitations de taux de requêtes (généralement non problématiques)
- **Historique limité** : L'historique des événements est limité aux derniers événements

### Limitations du plugin
- **Surveillance utilisateur** : Le suivi des utilisateurs nécessite des appels API supplémentaires
- **États complexes** : Certains états avancés de Somfy Protect peuvent ne pas être mappés parfaitement
- **Notifications** : Le plugin ne gère pas les notifications push natives

## Support et contribution

### Signaler un problème
1. Activez les logs de débogage dans Homebridge
2. Reproduisez le problème
3. Ouvrez une issue sur GitHub avec :
   - La version de Homebridge
   - La version du plugin
   - Les logs d'erreur (sans informations sensibles)
   - La configuration utilisée (sans mots de passe)

### Contribuer au projet
1. Fork le repository
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add amazing feature'`)
4. Pushez sur la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

### Tests
```bash
# Installation des dépendances de test
npm install --dev

# Exécution des tests
npm test

# Tests avec coverage
npm run test:coverage
```

## Compatibilité

### Versions Homebridge supportées
- Homebridge 1.3.0+
- Homebridge 1.4.x ✅
- Homebridge 1.5.x ✅
- Homebridge 1.6.x ✅

### Versions Node.js supportées
- Node.js 14.18.1+ ✅
- Node.js 16.x ✅
- Node.js 18.x ✅
- Node.js 20.x ✅

### Systèmes d'exploitation
- macOS ✅
- Linux ✅
- Windows ✅
- Raspberry Pi ✅

## FAQ

### Q: Le plugin fonctionne-t-il avec tous les produits Somfy ?
**R:** Non, ce plugin est spécifiquement conçu pour Somfy Protect (anciennement Myfox). Il ne fonctionne pas avec TaHoma ou d'autres systèmes Somfy.

### Q: Puis-je utiliser le plugin avec plusieurs maisons ?
**R:** Oui, spécifiez le `siteId` dans la configuration. Vous pouvez créer plusieurs accessoires avec des `siteId` différents.

### Q: Le suivi des utilisateurs consomme-t-il beaucoup de ressources ?
**R:** Non, le plugin fait une requête API toutes les 30 secondes seulement quand `logUserChanges` est activé. L'impact est minimal.

### Q: Que se passe-t-il si mon Internet est coupé ?
**R:** Le plugin ne pourra pas communiquer avec Somfy Protect. Les commandes locales HomeKit échoueront jusqu'au retour de la connexion.

### Q: Puis-je personnaliser la fréquence de surveillance ?
**R:** Actuellement, la fréquence est fixée à 30 secondes. Cette valeur offre un bon équilibre entre réactivité et conservation des ressources.

## Exemples de configuration avancée

### Configuration pour plusieurs sites
```json
{
  "accessories": [
    {
      "accessory": "SomfyProtect",
      "name": "Maison Principale",
      "username": "mon.email@somfy.fr",
      "password": "mon.mot.de.passe",
      "siteId": "site1-abc123",
      "logUserChanges": true
    },
    {
      "accessory": "SomfyProtect",
      "name": "Résidence Secondaire",
      "username": "mon.email@somfy.fr",
      "password": "mon.mot.de.passe",
      "siteId": "site2-def456",
      "logUserChanges": false
    }
  ]
}
```

### Configuration sans suivi utilisateur (performance optimisée)
```json
{
  "accessory": "SomfyProtect",
  "name": "Somfy Protect",
  "username": "mon.email@somfy.fr",
  "password": "mon.mot.de.passe",
  "logUserChanges": false
}
```

## Licence

Ce projet est sous licence Apache 2.0. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Remerciements

- **Projet original** : Basé sur [homebridge-somfy-protect](https://github.com/alxscms/homebridge-somfy-protect) par alxscms
- **Communauté Homebridge** : Pour l'écosystème et les outils de développement
- **Somfy** : Pour l'API Myfox/Somfy Protect (non officielle)
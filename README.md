# NeuroCode v2 - IA

<div align="center">
  <img src="./public/logo-light-styled.png" alt="NeuroCode Logo">
  <h3>Assistant IA Expert pour le Développement</h3>
  <p>Une plateforme de développement alimentée par l'IA avec environnement d'exécution intégré</p>
</div>

## 🚀 Aperçu

NeuroCode est un assistant IA avancé conçu pour les développeurs, offrant une expérience de développement complète avec un environnement d'exécution intégré dans le navigateur. Basé sur la technologie WebContainer, il permet d'exécuter du code directement dans le navigateur sans nécessiter de serveur distant.

## ✨ Fonctionnalités Principales

### 🤖 Assistant IA Intelligent
- **Chat interactif** avec un assistant IA expert en développement
- **Support multi-modèles** : OpenAI, Anthropic, Google, Groq, HuggingFace, et plus
- **Génération de code** intelligente et contextuelle
- **Analyse et débogage** automatique des erreurs

### 💻 Environnement de Développement
- **WebContainer intégré** pour l'exécution de code dans le navigateur
- **Terminal interactif** avec émulation zsh
- **Éditeur de code** avec coloration syntaxique (CodeMirror)
- **Prévisualisation en temps réel** des applications web
- **Système de fichiers** complet avec gestion des modifications

### 🔧 Outils de Développement
- **Support multi-langages** : JavaScript, TypeScript, Python, HTML, CSS, et plus
- **Frameworks supportés** : React, Vue, Svelte, Angular, Next.js, Remix, et autres
- **Gestion de projets** avec historique des conversations
- **Déploiement automatique** vers Netlify
- **Intégration Git** pour la gestion de versions

### 🗄️ Intégrations Base de Données
- **Supabase** : Connexion et exécution de requêtes SQL
- **Interface graphique** pour la gestion des bases de données
- **Génération automatique** de schémas et requêtes

### 🎨 Interface Utilisateur
- **Design moderne** avec thème sombre/clair
- **Interface responsive** adaptée à tous les écrans
- **Drag & Drop** pour la gestion des fichiers
- **Notifications** en temps réel
- **Raccourcis clavier** pour une productivité optimale

## 🛠️ Technologies Utilisées

### Frontend
- **Remix** - Framework React full-stack
- **React** - Bibliothèque d'interface utilisateur
- **TypeScript** - Langage de programmation typé
- **Vite** - Outil de build rapide
- **UnoCSS** - Framework CSS atomique
- **Framer Motion** - Animations fluides

### Backend & IA
- **Cloudflare Workers** - Plateforme serverless
- **AI SDK** - Intégration multi-modèles IA
- **WebContainer API** - Environnement d'exécution navigateur

### Outils de Développement
- **CodeMirror** - Éditeur de code avancé
- **XTerm.js** - Terminal dans le navigateur
- **Electron** - Application desktop (optionnel)
- **Docker** - Conteneurisation

## 📋 Prérequis

- **Node.js** >= 18.18.0
- **pnpm** (gestionnaire de paquets recommandé)
- **Clés API** pour les modèles IA (optionnel)

## 🚀 Installation

### 1. Cloner le repository
```bash
git clone https://github.com/votre-username/NeuroCode-v2-IA.git
cd NeuroCode-v2-IA
```

### 2. Installer les dépendances
```bash
pnpm install
```

### 3. Configuration des variables d'environnement
```bash
cp .env.example .env.local
```

Éditez `.env.local` et ajoutez vos clés API :

```env
# OpenAI (optionnel)
OPENAI_API_KEY=your_openai_api_key

# Anthropic Claude (optionnel)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Google Generative AI (optionnel)
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key

# Groq (optionnel)
GROQ_API_KEY=your_groq_api_key

# Autres modèles...
```

### 4. Lancer l'application

#### Mode développement
```bash
pnpm dev
```

#### Mode production
```bash
pnpm build
pnpm start
```

L'application sera accessible sur `http://localhost:5173`

## 🐳 Docker

### Build et lancement avec Docker
```bash
# Build de l'image
pnpm dockerbuild

# Lancement du conteneur
pnpm dockerrun
```

### Docker Compose
```bash
docker-compose up -d
```

## 📱 Application Desktop (Electron)

### Build pour différentes plateformes
```bash
# Windows
pnpm electron:build:win

# macOS
pnpm electron:build:mac

# Linux
pnpm electron:build:linux

# Toutes les plateformes
pnpm electron:build:dist
```

## 🔧 Configuration

### Modèles IA Supportés

- **OpenAI** : GPT-4, GPT-3.5-turbo
- **Anthropic** : Claude 3 (Opus, Sonnet, Haiku)
- **Google** : Gemini Pro, Gemini Pro Vision
- **Groq** : Llama, Mixtral
- **HuggingFace** : Modèles open-source
- **Ollama** : Modèles locaux
- **OpenRouter** : Accès à de nombreux modèles

### Personnalisation

Le projet utilise UnoCSS pour le styling. Vous pouvez personnaliser les thèmes dans :
- `app/styles/` - Styles globaux
- `uno.config.ts` - Configuration UnoCSS

## 📚 Utilisation

### 1. Chat avec l'IA
- Tapez votre question ou demande dans la zone de chat
- L'IA peut générer du code, expliquer des concepts, déboguer des erreurs
- Utilisez des commandes spéciales comme `/fix` pour corriger des erreurs

### 2. Gestion des Fichiers
- Créez, modifiez et supprimez des fichiers via l'interface
- L'IA peut générer des fichiers complets ou modifier du code existant
- Prévisualisez les changements en temps réel

### 3. Terminal Intégré
- Exécutez des commandes directement dans le navigateur
- Support pour npm, node, python (bibliothèque standard uniquement)
- Gestion des processus et des serveurs de développement

### 4. Déploiement
- Connectez votre compte Netlify pour un déploiement automatique
- L'IA peut configurer et optimiser votre projet pour la production

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. **Fork** le projet
2. **Créez** une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. **Committez** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrez** une Pull Request

### Guidelines de Développement

- Utilisez TypeScript pour tout nouveau code
- Suivez les conventions de nommage existantes
- Ajoutez des tests pour les nouvelles fonctionnalités
- Documentez les changements importants

## 🧪 Tests

```bash
# Lancer les tests
pnpm test

# Tests en mode watch
pnpm test:watch

# Vérification des types
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix
```

## 📖 Documentation

La documentation complète est disponible dans le dossier `docs/` et peut être générée avec MkDocs :

```bash
cd docs
pip install -r requirements.txt
mkdocs serve
```

## 🔒 Sécurité

- Les clés API sont stockées de manière sécurisée
- Aucune donnée sensible n'est envoyée aux serveurs tiers sans autorisation
- Le code s'exécute dans un environnement sandboxé (WebContainer)
- Chiffrement des données de session

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🙏 Remerciements

- **StackBlitz** pour la technologie WebContainer
- **bolt.diy** pour l'inspiration et la base du projet
- La communauté open-source pour les nombreuses bibliothèques utilisées

## 📞 Support

- **Issues** : [GitHub Issues](https://github.com/votre-username/NeuroCode-v2-IA/issues)
- **Discussions** : [GitHub Discussions](https://github.com/votre-username/NeuroCode-v2-IA/discussions)
- **Email** : support@neurocode.dev

---

<div align="center">
  <p>Fait avec ❤️ par l'équipe NeuroCode</p>
  <p>© 2024 NeuroCode. Tous droits réservés.</p>
</div>

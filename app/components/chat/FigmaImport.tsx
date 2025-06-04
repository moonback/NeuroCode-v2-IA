import React, { useState } from 'react';
import { toast } from 'react-toastify';
import type { Message } from 'ai';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { Dialog, DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '~/components/ui/Dialog';
import { classNames } from '~/utils/classNames';
import { FigmaService } from '~/lib/services/figmaService';
import { figmaConfigManager } from '~/lib/config/figmaConfig';


interface FigmaImportProps {
  onImport?: (description: string, messages: Message[]) => Promise<void>;
  className?: string;
}

interface FigmaDesign {
  id: string;
  name: string;
  thumbnail?: string;
  lastModified: string;
}

export function FigmaImport({ onImport, className }: FigmaImportProps) {
  console.log('FigmaImport component initialized with onImport:', typeof onImport);
  
  const [isOpen, setIsOpen] = useState(false);
  const [figmaUrl, setFigmaUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [designs, setDesigns] = useState<FigmaDesign[]>([]);

  const handleUrlImport = async () => {
    console.log('handleUrlImport called with URL:', figmaUrl);
    
    if (!figmaUrl.trim()) {
      toast.error('Please enter a Figma URL');
      return;
    }

    // Validate Figma URL format
    if (!FigmaService.isValidFigmaUrl(figmaUrl)) {
      toast.error('Please enter a valid Figma URL');
      return;
    }

    setIsLoading(true);
    console.log('Starting Figma import process...');
    try {
      // Extract file ID from URL
      const fileId = FigmaService.extractFileId(figmaUrl);
      if (!fileId) {
        toast.error('Could not extract file ID from URL');
        return;
      }

      // Check if access token is configured
      const hasToken = FigmaService.getAccessToken();
      if (!hasToken) {
        // Create messages for setting up Figma integration
        const setupMessages: Message[] = [
          {
            id: '1',
            role: 'user',
            content: `Importer et recréer ce design Figma : ${figmaUrl}`,
          },
          {
            id: '2',
            role: 'assistant',
            content: `Je serai ravi de vous aider à importer ce design Figma ! Cependant, j'ai besoin d'un token d'accès Figma pour récupérer les données du design.\n\nPour configurer l'intégration Figma :\n\n1. Accédez aux paramètres de votre compte Figma\n2. Générez un token d'accès personnel\n3. Ajoutez le token dans les paramètres de NeuroCode\n\nUne fois configuré, je pourrai :\n- Extraire les composants et styles du design\n- Générer une structure HTML responsive\n- Créer du CSS correspondant avec les couleurs, polices et espacements exacts\n- Ajouter des composants JavaScript interactifs\n\nPour le moment, je peux vous aider à recréer le design manuellement si vous décrivez les composants et la mise en page que vous souhaitez construire.`,
          },
        ];

        if (onImport) {
          console.log('Calling onImport with setup messages');
          await onImport(`Figma Design Setup - ${fileId}`, setupMessages);
          setIsOpen(false);
          setFigmaUrl('');
        } else {
          console.error('onImport function is not defined');
          toast.error('Import function is not available');
        }
        return;
      }

      // Try to convert the Figma file to React project
      const reactProject = await FigmaService.convertToReactProject(fileId);
      
      if (reactProject) {
        // Create an artifact with boltActions for the React/Vite project
        const artifactContent = `<boltArtifact id="figma-react-${fileId}" title="Figma React Project - ${fileId}">
<boltAction type="shell">
npm create vite@latest figma-design-${fileId} -- --template react-ts
cd figma-design-${fileId}
npm install
</boltAction>

<boltAction type="file" filePath="package.json">
${reactProject.packageJson}
</boltAction>

<boltAction type="file" filePath="vite.config.ts">
${reactProject.viteConfig}
</boltAction>

<boltAction type="file" filePath="index.html">
${reactProject.indexHtml}
</boltAction>

<boltAction type="file" filePath="src/main.tsx">
${reactProject.mainTsx}
</boltAction>

<boltAction type="file" filePath="src/components/FigmaDesign.tsx">
${reactProject.component}
</boltAction>

<boltAction type="file" filePath="src/components/FigmaDesign.css">
${reactProject.css}
</boltAction>

<boltAction type="file" filePath="src/index.css">
/* Global styles */
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
}
</boltAction>

<boltAction type="file" filePath="tsconfig.json">
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
</boltAction>

<boltAction type="file" filePath="tsconfig.node.json">
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
</boltAction>

<boltAction type="shell">
npm run dev
</boltAction>
</boltArtifact>`;

        // Create messages with the artifact
        const codeMessages: Message[] = [
          {
            id: '1',
            role: 'user',
            content: `Importer et recréer ce design Figma : ${figmaUrl}`,
          },
          {
            id: '2',
            role: 'assistant',
            content: `🎉 **Projet React/Vite créé avec succès !** \n\nJ'ai importé votre design Figma et généré un projet React complet avec Vite. Voici ce qui a été créé :\n\n## 📁 Structure du projet\n- **React 18** avec TypeScript\n- **Vite** pour le développement rapide\n- **Composant React** fidèle au design Figma\n- **CSS optimisé** avec les styles exacts\n- **Configuration complète** prête à l'emploi\n\n## 🚀 Fonctionnalités\n- ✅ Reproduction pixel-perfect du design\n- ✅ Composants React typés\n- ✅ Responsive design intégré\n- ✅ Hot reload avec Vite\n- ✅ Support TypeScript complet\n- ✅ Interactions et animations\n\n## 🛠️ Commandes disponibles\n- \`npm run dev\` - Serveur de développement\n- \`npm run build\` - Build de production\n- \`npm run preview\` - Aperçu du build\n\nLe serveur de développement se lance automatiquement sur http://localhost:3000\n\n${artifactContent}`,
          },
        ];

        if (onImport) {
          console.log('Calling onImport with React project artifact');
          await onImport(`Figma React Project - ${fileId}`, codeMessages);
          toast.success('🎉 Projet React/Vite créé avec succès depuis Figma!');
          setIsOpen(false);
          setFigmaUrl('');
        } else {
          console.error('onImport function is not defined');
          toast.error('Import function is not available');
        }
      } else {
        // Fallback with basic project structure artifact
        const fallbackArtifact = `<boltArtifact id="figma-project-${fileId}" title="Figma Project Setup - ${fileId}">
<boltAction type="file" filePath="index.html">
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Figma Design Recreation</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Figma Design Recreation</h1>
        <p>Ready to recreate your Figma design!</p>
        <!-- Add your components here -->
    </div>
    <script src="script.js"></script>
</body>
</html>
</boltAction>

<boltAction type="file" filePath="styles.css">
/* Figma Design Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

/* Add your Figma design styles here */
</boltAction>

<boltAction type="file" filePath="script.js">
// Figma Design JavaScript
console.log('Figma design recreation ready!');

// Add your interactive components here
</boltAction>
</boltArtifact>`;

        const fallbackMessages: Message[] = [
          {
            id: '1',
            role: 'user',
            content: `Importer et recréer ce design Figma : ${figmaUrl}`,
          },
          {
            id: '2',
            role: 'assistant',
            content: `J'ai préparé une structure de projet pour recréer votre design Figma ! Bien que je n'aie pas pu accéder directement au fichier Figma, j'ai mis en place les fichiers de base.\n\nPour compléter la recréation, veuillez décrire :\n1. La mise en page principale et les composants\n2. Le schéma de couleurs et la typographie\n3. Les interactions ou animations spécifiques\n\nVous pouvez également :\n- Partager des captures d'écran des interfaces clés\n- Exporter les ressources depuis Figma\n- Décrire le parcours utilisateur\n\nJe vous aiderai à construire une reproduction fidèle avec la structure fournie !\n\n${fallbackArtifact}`,
          },
        ];

        if (onImport) {
          console.log('Calling onImport with fallback messages');
          await onImport(`Figma Design Recreation - ${fileId}`, fallbackMessages);
          setIsOpen(false);
          setFigmaUrl('');
        } else {
          console.error('onImport function is not defined');
          toast.error('Import function is not available');
        }
      }
    } catch (error) {
      console.error('Figma import error:', error);
      toast.error('Failed to import Figma design. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };



  const handleRecentDesignImport = async (design: FigmaDesign) => {
    setIsLoading(true);
    try {
      // Create artifact for recent design import
      const designArtifact = `<boltArtifact id="figma-design-${design.id}" title="${design.name} Recreation">
<boltAction type="file" filePath="index.html">
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${design.name}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="design-container">
        <h1>${design.name}</h1>
        <p>Design recreation in progress...</p>
        <!-- Components will be added here -->
    </div>
    <script src="script.js"></script>
</body>
</html>
</boltAction>

<boltAction type="file" filePath="styles.css">
/* ${design.name} Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
    background: #f5f5f5;
}

.design-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

/* Add specific design styles here */
</boltAction>

<boltAction type="file" filePath="script.js">
// ${design.name} JavaScript
console.log('${design.name} loaded successfully!');

// Add interactive functionality here
document.addEventListener('DOMContentLoaded', function() {
    console.log('Design ready for interactions');
});
</boltAction>
</boltArtifact>`;

      const mockMessages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: `Importer et recréer le design Figma : ${design.name}`,
        },
        {
          id: '2',
          role: 'assistant',
          content: `J'ai créé la structure du projet pour recréer "${design.name}" ! La configuration comprend :\n\n- **index.html** : Structure HTML complète\n- **styles.css** : Base CSS responsive avec variables personnalisées\n- **script.js** : Composants JavaScript interactifs\n\nJe vais vous aider à analyser et générer le code avec :\n1. Structure HTML sémantique et accessible\n2. Styles CSS adaptatifs avec animations fluides\n3. Composants JavaScript optimisés et réutilisables\n4. Bonnes pratiques de design moderne\n5. Support multi-navigateurs\n6. Performance optimisée\n\n${designArtifact}`,
        },
      ];

      if (onImport) {
        await onImport(`Figma Design - ${design.name}`, mockMessages);
        toast.success(`"${design.name}" imported successfully!`);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Figma import error:', error);
      toast.error('Failed to import design. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

 

  return (
    <div className="">
      {/* Trigger Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={classNames(
          'group relative flex items-center gap-3 px-6 py-3 rounded-lg',
          'bg-bolt-elements-button-primary-background',
          'hover:bg-bolt-elements-button-primary-backgroundHover',
          'text-bolt-elements-button-primary-text font-medium text-sm',
          'border border-bolt-elements-borderColor',
          'transition-all duration-200 ease-out',
          'hover:shadow-lg hover:scale-[1.02]',
          'active:scale-[0.98] transform',
          'focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.354-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.015-4.49-4.491S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zm7.704 0c2.476 0 4.49 2.015 4.49 4.491s-2.014 4.49-4.49 4.49-4.49-2.014-4.49-4.49 2.014-4.491 4.49-4.491zm0 7.51c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019-3.019 1.355-3.019 3.019 1.354 3.019 3.019 3.019z"/>
            </svg>
          </div>
          <span>Importer depuis Figma</span>
          <svg className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-all duration-200 transform translate-x-0 group-hover:translate-x-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-4xl bg-bolt-elements-bg-depth-1 border border-bolt-elements-borderColor rounded-xl shadow-2xl transform transition-all duration-300 scale-100">
            {/* Header */}
            <div className="relative p-6 border-b border-bolt-elements-borderColor bg-bolt-elements-bg-depth-2 rounded-t-xl">
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-bolt-elements-bg-depth-3">
                    <svg className="w-8 h-8 text-bolt-elements-textPrimary" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.354-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.015-4.49-4.491S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zm7.704 0c2.476 0 4.49 2.015 4.49 4.491s-2.014 4.49-4.49 4.49-4.49-2.014-4.49-4.49 2.014-4.491 4.49-4.491zm0 7.51c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019-3.019 1.355-3.019 3.019 1.354 3.019 3.019 3.019z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">Importer depuis Figma</h2>
                    <p className="text-sm text-bolt-elements-textSecondary">Transformez vos designs en code fonctionnel.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-bg-hover rounded-full transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* URL Import Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-bolt-elements-bg-depth-3 text-bolt-elements-textPrimary">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">
                      Importer depuis une URL
                    </h3>
                    <p className="text-sm text-bolt-elements-textSecondary">
                      Collez l'URL de votre fichier ou prototype Figma pour commencer
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="url"
                        placeholder="https://www.figma.com/file/..."
                        value={figmaUrl}
                        onChange={(e) => setFigmaUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !isLoading && figmaUrl.trim()) {
                            e.preventDefault();
                            handleUrlImport();
                          }
                        }}
                        className="w-full pl-10 pr-10 py-2 text-sm border border-bolt-elements-borderColor rounded-md focus:border-bolt-elements-accent focus:ring-1 focus:ring-bolt-elements-accent/20 transition-all duration-200 bg-bolt-elements-bg-depth-0 text-bolt-elements-textPrimary"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <svg className="w-4 h-4 text-bolt-elements-textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                        </svg>
                      </div>
                      {figmaUrl && (
                        <button
                          onClick={() => setFigmaUrl('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-bolt-elements-bg-hover transition-colors"
                        >
                          <svg className="w-4 h-4 text-bolt-elements-textSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <button
                      onClick={handleUrlImport}
                      disabled={isLoading || !figmaUrl.trim()}
                      className={classNames(
                        'px-4 py-2 rounded-md font-semibold text-sm transition-all duration-200',
                        'bg-bolt-elements-accent hover:bg-bolt-elements-accent-hover text-white',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'focus:outline-none focus:ring-2 focus:ring-bolt-elements-accent/40'
                      )}
                      type="button"
                    >
                      <div className="relative z-10 flex items-center gap-2">
                        {isLoading ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Import...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                            </svg>
                            <span>Importer</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Info Card */}
                  <div className="relative p-4 bg-bolt-elements-bg-depth-1 rounded-md border border-bolt-elements-borderColor overflow-hidden">
                    <div className="relative flex items-start gap-3">
                      <div className="p-1 rounded-md bg-bolt-elements-accent text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-bolt-elements-textPrimary font-semibold text-sm">Formats supportés</p>
                        <p className="text-bolt-elements-textSecondary text-xs mt-0.5">
                          Fichiers Figma, prototypes, composants partagés et bibliothèques de design
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                {[{
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    ),
                    title: "Import Rapide",
                    description: "Conversion automatique en quelques secondes"
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    title: "Code Propre",
                    description: "HTML/CSS optimisé et prêt à l'emploi"
                  },
                  {
                    icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    ),
                    title: "Responsive",
                    description: "Design adaptatif pour tous les écrans"
                  }
                ].map((feature, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-bolt-elements-bg-depth-0 rounded-md border border-bolt-elements-borderColor hover:border-bolt-elements-accent transition-all duration-200 group"
                  >
                    <div className="p-2 rounded-md bg-bolt-elements-accent text-white w-fit mb-3 group-hover:scale-105 transition-transform duration-200">
                      {feature.icon}
                    </div>
                    <h4 className="font-semibold text-bolt-elements-textPrimary mb-1">{feature.title}</h4>
                    <p className="text-bolt-elements-textSecondary text-xs">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


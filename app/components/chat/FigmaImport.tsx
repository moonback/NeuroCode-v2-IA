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
            content: `Import and recreate this Figma design: ${figmaUrl}`,
          },
          {
            id: '2',
            role: 'assistant',
            content: `I'd love to help you import this Figma design! However, I need a Figma access token to fetch the design data.\n\nTo set up Figma integration:\n\n1. Go to your Figma account settings\n2. Generate a personal access token\n3. Add the token in NeuroCode settings\n\nOnce configured, I'll be able to:\n- Extract design components and styles\n- Generate responsive HTML structure\n- Create matching CSS with exact colors, fonts, and spacing\n- Add interactive JavaScript components\n\nFor now, I can help you recreate the design manually if you describe the components and layout you'd like to build.`,
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

      // Try to convert the Figma file to web code
      const webCode = await FigmaService.convertToWebCode(fileId);
      
      if (webCode) {
        // Create an artifact with boltActions for the generated code
        const artifactContent = `<boltArtifact id="figma-import-${fileId}" title="Figma Design Import - ${fileId}">
<boltAction type="file" filePath="index.html">
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Figma Design</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
${webCode.html}
    <script src="script.js"></script>
</body>
</html>
</boltAction>

<boltAction type="file" filePath="styles.css">
${webCode.css}
</boltAction>

<boltAction type="file" filePath="script.js">
${webCode.js}
</boltAction>
</boltArtifact>`;

        // Create messages with the artifact
        const codeMessages: Message[] = [
          {
            id: '1',
            role: 'user',
            content: `Import and recreate this Figma design: ${figmaUrl}`,
          },
          {
            id: '2',
            role: 'assistant',
            content: `I've successfully imported your Figma design and created the necessary files! The code includes:\n\n- **index.html**: Complete HTML structure based on your Figma layers\n- **styles.css**: CSS styles matching your design colors, fonts, and spacing\n- **script.js**: JavaScript setup for interactions\n\nThe generated code features:\n- Semantic HTML structure\n- Responsive layout considerations\n- Exact color and typography matching\n- Interactive components ready for customization\n\n${artifactContent}`,
          },
        ];

        if (onImport) {
          console.log('Calling onImport with generated artifact');
          await onImport(`Figma Design - ${fileId}`, codeMessages);
          toast.success('Figma design imported and converted to code!');
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
            content: `Import and recreate this Figma design: ${figmaUrl}`,
          },
          {
            id: '2',
            role: 'assistant',
            content: `I've created a project structure ready for your Figma design recreation! While I couldn't access the Figma file directly, I've set up the foundation files.\n\nTo complete the recreation, please describe:\n1. The main layout and components\n2. Color scheme and typography\n3. Any specific interactions or animations\n\nOr you can:\n- Share screenshots of key screens\n- Export assets from Figma\n- Describe the user flow\n\nI'll help you build a pixel-perfect recreation with the provided structure!\n\n${fallbackArtifact}`,
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
          content: `Import and recreate the Figma design: ${design.name}`,
        },
        {
          id: '2',
          role: 'assistant',
          content: `I've created the project structure for "${design.name}" recreation! The setup includes:\n\n- **index.html**: Base HTML structure\n- **styles.css**: Responsive CSS foundation\n- **script.js**: JavaScript for interactions\n\nI'll help you analyze the design components and generate the corresponding code with:\n1. Semantic HTML structure\n2. Responsive CSS styling\n3. Interactive JavaScript components\n4. Modern design patterns\n\n${designArtifact}`,
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

  // Mock recent designs - in a real implementation, this would come from Figma API
  const mockRecentDesigns: FigmaDesign[] = [
    {
      id: '1',
      name: 'Mobile App Dashboard',
      lastModified: '2 hours ago',
    },
    {
      id: '2',
      name: 'Landing Page Design',
      lastModified: '1 day ago',
    },
    {
      id: '3',
      name: 'E-commerce Product Page',
      lastModified: '3 days ago',
    },
  ];

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


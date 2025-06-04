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
        // Create messages with the generated code
        const codeMessages: Message[] = [
          {
            id: '1',
            role: 'user',
            content: `Import and recreate this Figma design: ${figmaUrl}`,
          },
          {
            id: '2',
            role: 'assistant',
            content: `I've successfully imported your Figma design! Here's the generated code:\n\n## HTML Structure\n\`\`\`html\n${webCode.html}\`\`\`\n\n## CSS Styles\n\`\`\`css\n${webCode.css}\`\`\`\n\n## JavaScript\n\`\`\`javascript\n${webCode.js}\`\`\`\n\nThe code includes:\n- Semantic HTML structure based on your Figma layers\n- CSS styles matching your design colors, fonts, and spacing\n- Responsive layout considerations\n- Basic JavaScript setup for interactions\n\nYou can now customize and enhance this code as needed!`,
          },
        ];

        if (onImport) {
          console.log('Calling onImport with generated code');
          await onImport(`Figma Design - ${fileId}`, codeMessages);
          toast.success('Figma design imported and converted to code!');
          setIsOpen(false);
          setFigmaUrl('');
        } else {
          console.error('onImport function is not defined');
          toast.error('Import function is not available');
        }
      } else {
        // Fallback to manual recreation prompt
        const fallbackMessages: Message[] = [
          {
            id: '1',
            role: 'user',
            content: `Import and recreate this Figma design: ${figmaUrl}`,
          },
          {
            id: '2',
            role: 'assistant',
            content: `I encountered an issue accessing the Figma file directly, but I can still help you recreate the design!\n\nPlease describe:\n1. The main layout and components\n2. Color scheme and typography\n3. Any specific interactions or animations\n\nOr you can:\n- Share screenshots of key screens\n- Export assets from Figma\n- Describe the user flow\n\nI'll help you build a pixel-perfect recreation with clean, responsive code!`,
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
      const mockMessages: Message[] = [
        {
          id: '1',
          role: 'user',
          content: `Import and recreate the Figma design: ${design.name}`,
        },
        {
          id: '2',
          role: 'assistant',
          content: `I'll help you recreate the "${design.name}" design from Figma. Let me analyze the design components and generate the corresponding code.\n\nI'll create:\n1. Semantic HTML structure\n2. Responsive CSS styling\n3. Interactive JavaScript components\n4. Modern design patterns\n\nStarting the conversion process...`,
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
    <DialogRoot open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className={classNames(
            'flex items-center gap-2 px-4 py-2 rounded-lg border border-bolt-elements-borderColor',
            'bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-900',
            'text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary',
            'text-sm transition-theme',
            className
          )}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.354-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.015-4.49-4.491S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zm7.704 0c2.476 0 4.49 2.015 4.49 4.491s-2.014 4.49-4.49 4.49-4.49-2.014-4.49-4.49 2.014-4.491 4.49-4.491zm0 7.51c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019-3.019 1.355-3.019 3.019 1.354 3.019 3.019 3.019z"/>
          </svg>
          Figma
        </button>
      </DialogTrigger>
      <Dialog>
        <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.354-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.015-4.49-4.491S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zm7.704 0c2.476 0 4.49 2.015 4.49 4.491s-2.014 4.49-4.49 4.49-4.49-2.014-4.49-4.49 2.014-4.491 4.49-4.491zm0 7.51c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019-3.019 1.355-3.019 3.019 1.354 3.019 3.019 3.019z"/>
            </svg>
            Import from Figma
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* URL Import Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-bolt-elements-textPrimary">
              Import from URL
            </h3>
            <div className="flex gap-2">
              <Input
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
                className="flex-1"
              />
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  handleUrlImport();
                }}
                disabled={isLoading || !figmaUrl.trim()}
                className="px-4"
                type="button"
              >
                {isLoading ? (
                  <div className="i-ph:spinner-gap w-4 h-4 animate-spin" />
                ) : (
                  'Import'
                )}
              </Button>
            </div>
            <p className="text-xs text-bolt-elements-textSecondary">
              Paste a Figma file or prototype URL to import the design
            </p>
          </div>

          {/* Recent Designs Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-bolt-elements-textPrimary">
              Recent Designs
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {mockRecentDesigns.map((design) => (
                <button
                  key={design.id}
                  onClick={() => handleRecentDesignImport(design)}
                  disabled={isLoading}
                  className="w-full p-3 text-left rounded-lg border border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-1 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-bolt-elements-textPrimary">
                        {design.name}
                      </div>
                      <div className="text-xs text-bolt-elements-textSecondary">
                        Modified {design.lastModified}
                      </div>
                    </div>
                    <div className="i-ph:arrow-right w-4 h-4 text-bolt-elements-textSecondary" />
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-bolt-elements-textSecondary">
              Connect your Figma account to see your recent designs
            </p>
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </DialogRoot>
  );
}
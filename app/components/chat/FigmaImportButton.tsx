import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '~/components/ui/Button';
import { Input } from '~/components/ui/Input';
import { toast } from 'react-toastify';
import { FigmaService } from '~/lib/services/figmaService';

interface FigmaImportButtonProps {
  onImport: (fileId: string) => Promise<void>;
}

export const FigmaImportButton: React.FC<FigmaImportButtonProps> = ({ onImport }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const extractFileIdFromUrl = (url: string): string | null => {
    // Si l'URL est vide, retourner null
    if (!url) return null;

    // Si c'est juste l'ID du fichier, le retourner directement
    if (/^[a-zA-Z0-9]+$/.test(url)) {
      return url;
    }

    // Patterns pour différents formats d'URL Figma
    const patterns = [
      /figma\.com\/file\/([a-zA-Z0-9]+)/,  // Format standard
      /figma\.com\/proto\/([a-zA-Z0-9]+)/,  // Format prototype
      /figma\.com\/embed\/([a-zA-Z0-9]+)/,  // Format embed
      /figma\.com\/design\/([a-zA-Z0-9]+)/  // Format design
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  };

  const handleUrlSubmit = async () => {
    const fileId = extractFileIdFromUrl(url);
    if (!fileId) {
      toast.error('Format d\'URL Figma invalide. Format attendu : https://www.figma.com/file/{fileId}/...');
      return;
    }

    setIsLoading(true);
    try {
      await onImport(fileId);
      setIsOpen(false);
      setUrl('');
    } catch (error) {
      console.error('Erreur lors de l\'importation du fichier Figma:', error);
      toast.error('Erreur lors de l\'importation du fichier Figma');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary hover:bg-bolt-elements-item-backgroundActive"
        >
          <div className="i-simple-icons:figma text-lg" />
          
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bolt-elements-background-depth-1 dark:bg-gray-950 p-6 rounded-lg shadow-xl border border-bolt-elements-borderColor w-[400px] z-[9999]">
          <Dialog.Title className="text-lg font-medium text-bolt-elements-textPrimary mb-4">
            Importer un fichier Figma
          </Dialog.Title>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="figma-url" className="text-sm font-medium text-bolt-elements-textSecondary">
                URL du fichier Figma
              </label>
              <Input
                id="figma-url"
                placeholder="https://www.figma.com/file/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor"
              />
            </div>
            <div className="text-sm text-bolt-elements-textTertiary">
              <div>Formats d'URL acceptés :</div>
              <ul className="list-disc pl-4 mt-1">
                <li>https://www.figma.com/file/{'{fileId}'}/...</li>
                <li>https://www.figma.com/proto/{'{fileId}'}/...</li>
                <li>https://www.figma.com/embed/{'{fileId}'}/...</li>
                <li>https://www.figma.com/design/{'{fileId}'}/...</li>
              </ul>
            </div>
            <Button
              onClick={handleUrlSubmit}
              disabled={isLoading || !url}
              className="w-full bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent hover:bg-bolt-elements-button-primary-backgroundHover"
            >
              {isLoading ? 'Importation...' : 'Importer'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}; 
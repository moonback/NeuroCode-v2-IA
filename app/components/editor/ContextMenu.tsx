import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import { memo, useState, useEffect, useRef } from 'react';
import { classNames } from '~/utils/classNames';
import { addContextItem } from '~/lib/stores/context';

interface ContextMenuProps {
  children: React.ReactNode;
  filePath: string;
  getSelectedText: () => string;
  getSelectionPosition?: () => { line: number; column: number } | undefined;
  onSendToChat?: (text: string) => void;
}

const ContextMenu = memo(({ children, filePath, getSelectedText, getSelectionPosition, onSendToChat }: ContextMenuProps) => {
  const [selectedText, setSelectedText] = useState('');
  const [isTextSelected, setIsTextSelected] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Vérifier si du texte est sélectionné avant d'ouvrir le menu contextuel
  const handleContextMenuOpen = () => {
    const text = getSelectedText();
    setSelectedText(text);
    setIsTextSelected(!!text && text.trim().length > 0);
  };

  // Ajouter le texte sélectionné au contexte
  const handleAddToContext = () => {
    if (selectedText && selectedText.trim().length > 0) {
      const position = getSelectionPosition?.();
      addContextItem({
        content: selectedText,
        filePath,
        position,
      });
    }
  };
  
  // Envoyer le texte sélectionné au chat pour explication ou correction
  const handleSendToChat = () => {
    if (selectedText && selectedText.trim().length > 0) {
      const prompt = `Peux-tu expliquer ou corriger ce code :\n\n\`\`\`\n${selectedText}\n\`\`\`\n\nChemin du fichier: ${filePath}`;
      onSendToChat?.(prompt);
    }
  };

  return (
    <ContextMenuPrimitive.Root onOpenChange={handleContextMenuOpen}>
      <ContextMenuPrimitive.Trigger asChild>{children}</ContextMenuPrimitive.Trigger>
      <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Content
          ref={menuRef}
          className="border border-bolt-elements-borderColor rounded-md z-context-menu bg-bolt-elements-background-depth-1 dark:bg-bolt-elements-background-depth-2 data-[state=open]:animate-in animate-duration-100 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-98 w-56"
          style={{ zIndex: 998 }}
        >
          {isTextSelected ? (
            <ContextMenuPrimitive.Group className="p-1">
              <ContextMenuItem onSelect={handleAddToContext}>
                <div className="flex items-center gap-2">
                  <div className="i-ph:brain" />
                  Ajouter au contexte LLM
                </div>
              </ContextMenuItem>
              {/* <ContextMenuItem onSelect={handleSendToChat}>
                <div className="flex items-center gap-2">
                  <div className="i-ph:code" />
                Expliquer via LLM
                </div>
              </ContextMenuItem> */}
              <ContextMenuItem onSelect={() => navigator.clipboard.writeText(selectedText)}>
                <div className="flex items-center gap-2">
                  <div className="i-ph:clipboard-text" />
                  Copier
                </div>
              </ContextMenuItem>
            </ContextMenuPrimitive.Group>
          ) : (
            <ContextMenuPrimitive.Group className="p-1">
              <ContextMenuItem onSelect={() => {}}>
                <div className="flex items-center gap-2 opacity-50">
                  <div className="i-ph:brain" />
                  Sélectionnez du texte
                </div>
              </ContextMenuItem>
            </ContextMenuPrimitive.Group>
          )}
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Root>
  );
});

function ContextMenuItem({ onSelect, children }: { onSelect?: () => void; children: React.ReactNode }) {
  return (
    <ContextMenuPrimitive.Item
      onSelect={onSelect}
      className="flex items-center gap-2 px-2 py-1.5 outline-0 text-sm text-bolt-elements-textPrimary cursor-pointer ws-nowrap text-bolt-elements-item-contentDefault hover:text-bolt-elements-item-contentActive hover:bg-bolt-elements-item-backgroundActive rounded-md"
    >
      <span className="size-4 shrink-0"></span>
      <span>{children}</span>
    </ContextMenuPrimitive.Item>
  );
}

export default ContextMenu;
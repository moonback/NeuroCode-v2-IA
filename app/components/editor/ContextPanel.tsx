import { memo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { contextItems, removeContextItem, clearContextItems, isContextPanelOpen, closeContextPanel, type ContextItem } from '~/lib/stores/context';
import { classNames } from '~/utils/classNames';
import { path } from '~/utils/path';

const ContextPanel = memo(() => {
  const items = useStore(contextItems);
  const isOpen = useStore(isContextPanelOpen);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  if (!isOpen) return null;

  const itemsArray = Object.values(items);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-4 right-4 w-96 max-h-[70vh] bg-bolt-elements-background-depth-1 dark:bg-bolt-elements-background-depth-2 rounded-lg shadow-lg border border-bolt-elements-borderColor overflow-hidden z-50"
        >
          <div className="flex items-center justify-between p-3 border-b border-bolt-elements-borderColor">
            <h3 className="text-sm font-medium text-bolt-elements-textPrimary">Contexte LLM</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={clearContextItems}
                className="p-1 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded-md hover:bg-bolt-elements-background-depth-3 transition-colors"
                title="Effacer tout le contexte"
              >
                <div className="i-ph:trash size-4" />
              </button>
              <button
                onClick={closeContextPanel}
                className="p-1 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded-md hover:bg-bolt-elements-background-depth-3 transition-colors"
                title="Fermer le panneau"
              >
                <div className="i-ph:x size-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(70vh-48px)]">
            {itemsArray.length === 0 ? (
              <div className="p-4 text-center text-bolt-elements-textSecondary text-sm">
                <div className="i-ph:brain size-6 mx-auto mb-2 opacity-50" />
                <p>Aucun élément de contexte ajouté</p>
                <p className="text-xs mt-1">Sélectionnez du texte dans l'éditeur et utilisez le menu contextuel pour ajouter du contexte</p>
              </div>
            ) : (
              <div className="divide-y divide-bolt-elements-borderColor">
                {itemsArray.map((item) => (
                  <ContextItemComponent 
                    key={item.id} 
                    item={item} 
                    isHovered={hoveredItemId === item.id}
                    onHover={() => setHoveredItemId(item.id)}
                    onLeave={() => setHoveredItemId(null)}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

interface ContextItemComponentProps {
  item: ContextItem;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

const ContextItemComponent = memo(({ item, isHovered, onHover, onLeave }: ContextItemComponentProps) => {
  const fileName = path.basename(item.filePath);
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(item.createdAt));

  return (
    <div 
      className="p-3 relative group"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 text-xs text-bolt-elements-textSecondary">
          <span className="i-ph:code size-3.5" />
          <span title={item.filePath}>{fileName}</span>
          {item.position && (
            <span className="text-bolt-elements-textTertiary">:L{item.position.line + 1}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-bolt-elements-textTertiary">{formattedDate}</span>
          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => removeContextItem(item.id)}
                className="p-1 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded-md hover:bg-bolt-elements-background-depth-3 transition-colors"
                title="Supprimer cet élément"
              >
                <div className="i-ph:x size-3" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="text-sm text-bolt-elements-textPrimary bg-bolt-elements-background-depth-3 p-2 rounded-md overflow-x-auto whitespace-pre-wrap">
        {item.content}
      </div>
    </div>
  );
});

export default ContextPanel;
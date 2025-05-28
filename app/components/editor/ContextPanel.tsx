import { memo, useState, useEffect, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  contextItems, 
  removeContextItem, 
  clearContextItems, 
  clearAllContextItems,
  isContextPanelOpen, 
  closeContextPanel, 
  togglePinContextItem,
  addTagToContextItem,
  contextPanelViewMode,
  contextSearchFilter,
  filteredContextItems,
  pinnedContextItems,
  contextItemsByType,
  type ContextItem 
} from '~/lib/stores/context';
import { classNames } from '~/utils/classNames';
import { path } from '~/utils/path';

const ContextPanel = memo(() => {
  const items = useStore(contextItems);
  const isOpen = useStore(isContextPanelOpen);
  const $viewMode = useStore(contextPanelViewMode);
  const $searchFilter = useStore(contextSearchFilter);
  const $filteredItems = useStore(filteredContextItems);
  const $pinnedItems = useStore(pinnedContextItems);
  const $itemsByType = useStore(contextItemsByType);
  
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Mettre à jour le filtre de recherche quand le terme de recherche change
  useEffect(() => {
    contextSearchFilter.set(searchTerm);
  }, [searchTerm]);

  // Filtrer et trier les éléments à afficher
  const displayedItems = useMemo(() => {
    let itemsToDisplay = $filteredItems;
    
    // Filtrer par type si un type est sélectionné
    if (selectedType) {
      itemsToDisplay = itemsToDisplay.filter(item => item.metadata?.type === selectedType);
    }
    
    // Trier par épinglé puis par date
    return itemsToDisplay.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [$filteredItems, selectedType]);

  if (!isOpen) return null;

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
                className="p-1 bg-red-900 text-white hover:text-bolt-elements-textPrimary hover:bg-red-500 rounded-md hover:bg-bolt-elements-background-depth-3 transition-colors"
                title="Effacer les éléments non épinglés"
              >
                <div className="i-ph:trash size-4" />
              </button>
              <button
                onClick={closeContextPanel}
                className="p-1 bg-bolt-elements-background-depth-4 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary rounded-md hover:bg-bolt-elements-background-depth-3 transition-colors"
                title="Fermer le panneau"
              >
                <div className="i-ph:x size-4" />
              </button>
            </div>
          </div>
          
          {/* Barre de recherche */}
          <div className="p-2 border-b border-bolt-elements-borderColor">
            <div className="relative">
              <div className="i-ph:magnifying-glass size-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-bolt-elements-textTertiary" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher dans le contexte..."
                className="w-full rounded-md border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 py-1 pl-8 pr-2 text-xs text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary"
              />
            </div>
          </div>
          
          {/* Onglets de filtrage */}
          <div className="p-2 border-b border-bolt-elements-borderColor">
            <div className="flex items-center gap-2">
              <button
                onClick={() => contextPanelViewMode.set('all')}
                className={classNames(
                  "rounded px-2 py-1 text-xs",
                  $viewMode === 'all' 
                    ? "bg-bolt-elements-background-depth-3 text-white" 
                    : "bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3"
                )}
              >
                Tous ({Object.keys(items).length})
              </button>
              <button
                onClick={() => contextPanelViewMode.set('pinned')}
                className={classNames(
                  "rounded px-2 py-1 text-xs",
                  $viewMode === 'pinned' 
                    ? "bg-bolt-elements-background-depth-3 text-white" 
                    : "bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3"
                )}
              >
                Épinglés ({$pinnedItems.length})
              </button>
              <button
                onClick={() => contextPanelViewMode.set('byType')}
                className={classNames(
                  "rounded px-2 py-1 text-xs",
                  $viewMode === 'byType' 
                    ? "bg-bolt-elements-background-depth-3 text-white" 
                    : "bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3"
                )}
              >
                <div className="i-ph:funnel size-3.5" />
              </button>
            </div>
            
            {/* Filtres par type si le mode est 'byType' */}
            {$viewMode === 'byType' && (
              <div className="mt-2 flex flex-wrap gap-1">
                <button
                  onClick={() => setSelectedType(null)}
                  className={classNames(
                    "rounded px-2 py-0.5 text-xs",
                    selectedType === null 
                      ? "bg-bolt-elements-background-depth-3 text-white" 
                      : "bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3"
                  )}
                >
                  Tous
                </button>
                <button
                  onClick={() => setSelectedType('code')}
                  className={classNames(
                    "flex items-center gap-1 rounded px-2 py-0.5 text-xs",
                    selectedType === 'code' 
                      ? "bg-bolt-elements-accent text-white" 
                      : "bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3"
                  )}
                >
                  <div className="i-ph:code size-3" />
                  Code ({$itemsByType.code?.length || 0})
                </button>
                <button
                  onClick={() => setSelectedType('error')}
                  className={classNames(
                    "flex items-center gap-1 rounded px-2 py-0.5 text-xs",
                    selectedType === 'error' 
                      ? "bg-bolt-elements-accent text-white" 
                      : "bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3"
                  )}
                >
                  <div className="i-ph:warning-circle size-3" />
                  Erreurs ({$itemsByType.error?.length || 0})
                </button>
                <button
                  onClick={() => setSelectedType('comment')}
                  className={classNames(
                    "flex items-center gap-1 rounded px-2 py-0.5 text-xs",
                    selectedType === 'comment' 
                      ? "bg-bolt-elements-accent text-white" 
                      : "bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3"
                  )}
                >
                  <div className="i-ph:chat-text size-3" />
                  Commentaires ({$itemsByType.comment?.length || 0})
                </button>
                <button
                  onClick={() => setSelectedType('text')}
                  className={classNames(
                    "flex items-center gap-1 rounded px-2 py-0.5 text-xs",
                    selectedType === 'text' 
                      ? "bg-bolt-elements-accent text-white" 
                      : "bg-bolt-elements-background-depth-2 text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3"
                  )}
                >
                  <div className="i-ph:text-t size-3" />
                  Texte ({$itemsByType.text?.length || 0})
                </button>
              </div>
            )}
          </div>

          <div className="overflow-y-auto max-h-[calc(70vh-140px)]">
            {displayedItems.length === 0 ? (
              <div className="p-4 text-center text-bolt-elements-textSecondary text-sm">
                <div className="i-ph:brain size-6 mx-auto mb-2 opacity-50" />
                <p>{searchTerm ? 'Aucun résultat pour cette recherche' : 'Aucun élément de contexte ajouté'}</p>
                {!searchTerm && (
                  <p className="text-xs mt-1">Sélectionnez du texte dans l'éditeur et utilisez le menu contextuel pour ajouter du contexte</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-bolt-elements-borderColor">
                {displayedItems.map((item) => (
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
          
          {/* Footer avec actions supplémentaires */}
          <div className="border-t border-bolt-elements-borderColor p-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-bolt-elements-textTertiary">
                {displayedItems.length} élément{displayedItems.length !== 1 ? 's' : ''}
              </span>
              {Object.keys(items).length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Êtes-vous sûr de vouloir supprimer tous les éléments, y compris ceux épinglés ?')) {
                      clearAllContextItems();
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  Tout supprimer
                </button>
              )}
            </div>
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
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag.trim()) {
      addTagToContextItem(item.id, newTag.trim());
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  const getTypeIcon = () => {
    switch (item.metadata?.type) {
      case 'code':
        return <div className="i-ph:code size-3.5 text-blue-500" />;
      case 'error':
        return <div className="i-ph:warning-circle size-3.5 text-red-500" />;
      case 'comment':
        return <div className="i-ph:chat-text size-3.5 text-green-500" />;
      default:
        return <div className="i-ph:text-t size-3.5 text-gray-500" />;
    }
  };

  return (
    <div 
      className={classNames(
        "p-3 relative group",
        item.pinned ? "border-l-2 border-l-bolt-elements-accent" : ""
      )}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1 text-xs text-bolt-elements-textSecondary">
          {getTypeIcon()}
          <span title={item.filePath} className="max-w-[120px] truncate">{fileName}</span>
          {item.position && (
            <span className="text-bolt-elements-textTertiary">:L{item.position.line + 1}</span>
          )}
          {item.metadata?.language && (
            <span className="rounded bg-bolt-elements-background-depth-2 px-1 py-0.5 text-[10px] text-bolt-elements-textTertiary">
              {item.metadata.language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-bolt-elements-textTertiary">{formattedDate}</span>
          <AnimatePresence>
            {isHovered && (
              <>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => togglePinContextItem(item.id)}
                  className={classNames(
                    "p-1 rounded-md transition-colors",
                    item.pinned 
                      ? "text-bolt-elements-accent hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3" 
                      : "text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3"
                  )}
                  title={item.pinned ? "Désépingler" : "Épingler"}
                >
                  <div className={item.pinned ? "i-ph:push-pin-fill size-3" : "i-ph:push-pin size-3"} />
                </motion.button>
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
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="text-sm text-bolt-elements-textPrimary bg-bolt-elements-background-depth-3 p-2 rounded-md overflow-x-auto whitespace-pre-wrap">
        {item.content}
      </div>
      
      {/* Tags */}
      <div className="mt-2 flex flex-wrap gap-1">
        {item.metadata?.tags?.map((tag) => (
          <span key={tag} className="rounded-full bg-bolt-elements-background-depth-2 px-2 py-0.5 text-xs text-bolt-elements-textSecondary">
            {tag}
          </span>
        ))}
        
        {isAddingTag ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              className="h-5 w-20 rounded border border-bolt-elements-borderColor bg-bolt-elements-background-depth-2 px-1 text-xs text-bolt-elements-textPrimary"
              placeholder="Nouveau tag"
              autoFocus
            />
            <button
              onClick={handleAddTag}
              className="text-xs text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
            >
              +
            </button>
            <button
              onClick={() => setIsAddingTag(false)}
              className="text-xs text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTag(true)}
            className="flex items-center gap-0.5 rounded-full bg-bolt-elements-background-depth-2 px-1.5 py-0.5 text-xs text-bolt-elements-textTertiary hover:text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-3"
            title="Ajouter un tag"
          >
            <div className="i-ph:tag size-3" />
            <span>+</span>
          </button>
        )}
      </div>
    </div>
  );
});

export default ContextPanel;
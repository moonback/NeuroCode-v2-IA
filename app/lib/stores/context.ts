import { atom, map, computed } from 'nanostores';
import { getLocalStorage, setLocalStorage } from '~/lib/persistence/localStorage';
import { createScopedLogger } from '~/utils/logger';
import { getCurrentChatId } from '~/utils/fileLocks';

const logger = createScopedLogger('ContextStore');

// Clé pour stocker les éléments de contexte dans localStorage
export const CONTEXT_ITEMS_KEY = 'bolt.contextItems';

// Interface pour représenter un élément de contexte
export interface ContextItem {
  id: string;
  content: string;
  filePath: string;
  createdAt: Date;
  // Position dans le document (optionnel)
  position?: {
    line: number;
    column: number;
  };
  // Métadonnées supplémentaires
  metadata?: {
    language?: string;     // Langage de programmation
    type?: 'code' | 'text' | 'comment' | 'error'; // Type de contenu
    tags?: string[];      // Tags personnalisés
  };
  // Indicateur si l'élément est épinglé (ne sera pas supprimé par clearContextItems)
  pinned?: boolean;
}

// Store pour gérer les éléments de contexte par projet (chatId)
export const contextItems = map<Record<string, ContextItem>>({});

// Map pour stocker les contextes par projet
const projectContextsMap = new Map<string, Record<string, ContextItem>>();

// Obtenir le contexte du projet actuel
function getCurrentProjectContext(): Record<string, ContextItem> {
  const chatId = getCurrentChatId();
  if (!projectContextsMap.has(chatId)) {
    projectContextsMap.set(chatId, {});
  }
  return projectContextsMap.get(chatId) || {};
}

// Initialiser le store avec les données du localStorage
function initializeContextItems() {
  try {
    const savedItems = getLocalStorage(CONTEXT_ITEMS_KEY);
    if (savedItems && typeof savedItems === 'object') {
      // Vérifier si c'est l'ancien format (sans chatId) ou le nouveau format
      if (savedItems.byProject) {
        // Nouveau format avec projets
        const projectContexts = savedItems.byProject;
        
        // Reconstruire la map des projets
        Object.entries(projectContexts).forEach(([chatId, items]) => {
          const processedItems: Record<string, ContextItem> = {};
          
          Object.entries(items as Record<string, ContextItem>).forEach(([id, item]) => {
            const typedItem = item as ContextItem;
            processedItems[id] = {
              ...typedItem,
              createdAt: new Date(typedItem.createdAt)
            };
          });
          
          projectContextsMap.set(chatId, processedItems);
        });
        
        // Charger le contexte du projet actuel dans le store
        const currentContext = getCurrentProjectContext();
        contextItems.set(currentContext);
        
        logger.info(`Chargé les contextes pour ${projectContextsMap.size} projets depuis localStorage`);
      } else {
        // Ancien format (sans chatId) - migrer vers le nouveau format
        const processedItems: Record<string, ContextItem> = {};
        
        Object.entries(savedItems).forEach(([id, item]) => {
          const typedItem = item as ContextItem;
          processedItems[id] = {
            ...typedItem,
            createdAt: new Date(typedItem.createdAt)
          };
        });
        
        // Stocker dans le projet par défaut
        projectContextsMap.set('default', processedItems);
        
        // Si nous sommes dans un projet spécifique, utiliser ce contexte
        const chatId = getCurrentChatId();
        if (chatId !== 'default') {
          projectContextsMap.set(chatId, {});
          contextItems.set({});
        } else {
          contextItems.set(processedItems);
        }
        
        logger.info(`Migré ${Object.keys(processedItems).length} éléments de contexte vers le nouveau format`);
        
        // Sauvegarder immédiatement dans le nouveau format
        saveContextItems();
      }
    }
  } catch (error) {
    logger.error('Erreur lors du chargement des éléments de contexte depuis localStorage', error);
  }
}

// Sauvegarder les éléments de contexte dans localStorage
function saveContextItems() {
  try {
    // Mettre à jour la map du projet actuel
    const chatId = getCurrentChatId();
    const currentItems = contextItems.get();
    logger.info(`Sauvegarde pour le projet ${chatId} avec ${Object.keys(currentItems).length} éléments:`, Object.keys(currentItems));
    
    projectContextsMap.set(chatId, currentItems);
    
    // Sauvegarder tous les projets
    const projectContexts: Record<string, Record<string, ContextItem>> = {};
    projectContextsMap.forEach((items, projectId) => {
      projectContexts[projectId] = items;
      logger.info(`Projet ${projectId}: ${Object.keys(items).length} éléments`);
    });
    
    setLocalStorage(CONTEXT_ITEMS_KEY, { byProject: projectContexts });
    logger.info(`Sauvegardé les contextes pour ${projectContextsMap.size} projets dans localStorage`);
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde des éléments de contexte dans localStorage', error);
  }
}

// Initialiser au démarrage si on est côté client
if (typeof window !== 'undefined') {
  initializeContextItems();
  
  // Écouter les changements d'URL pour charger le contexte du projet approprié
  window.addEventListener('popstate', () => {
    const chatId = getCurrentChatId();
    const projectContext = projectContextsMap.get(chatId) || {};
    contextItems.set(projectContext);
    logger.info(`Changé de projet: chargé le contexte pour ${chatId}`);
  });
}

// S'abonner aux changements pour sauvegarder automatiquement
contextItems.listen(() => {
  saveContextItems();
});

// Fonction pour changer explicitement de projet
export function switchProjectContext(chatId: string) {
  // Sauvegarder le contexte actuel avant de changer
  const currentChatId = getCurrentChatId();
  projectContextsMap.set(currentChatId, contextItems.get());
  
  // Charger le nouveau contexte
  const projectContext = projectContextsMap.get(chatId) || {};
  contextItems.set(projectContext);
  logger.info(`Changé manuellement de projet: chargé le contexte pour ${chatId}`);
  
  // Sauvegarder dans localStorage
  saveContextItems();
}

// Store pour suivre si le panneau de contexte est ouvert
export const isContextPanelOpen = atom<boolean>(false);

// Store pour suivre le mode d'affichage du panneau (all, pinned, byType)
export const contextPanelViewMode = atom<'all' | 'pinned' | 'byType'>('all');

// Store pour suivre le filtre de recherche dans le panneau
export const contextSearchFilter = atom<string>('');

// Computed store pour obtenir les éléments filtrés
export const filteredContextItems = computed([contextItems, contextSearchFilter], (items, filter) => {
  const itemsArray = Object.values(items);
  if (!filter) return itemsArray;
  
  const lowerFilter = filter.toLowerCase();
  return itemsArray.filter(item => 
    item.content.toLowerCase().includes(lowerFilter) ||
    item.filePath.toLowerCase().includes(lowerFilter) ||
    item.metadata?.tags?.some(tag => tag.toLowerCase().includes(lowerFilter))
  );
});

// Computed store pour obtenir les éléments épinglés
export const pinnedContextItems = computed(contextItems, (items) => {
  return Object.values(items).filter(item => item.pinned);
});

// Computed store pour obtenir les éléments par type
export const contextItemsByType = computed(contextItems, (items) => {
  const result: Record<string, ContextItem[]> = {
    code: [],
    text: [],
    comment: [],
    error: [],
    other: []
  };
  
  Object.values(items).forEach(item => {
    const type = item.metadata?.type || 'other';
    if (type in result) {
      result[type].push(item);
    } else {
      result.other.push(item);
    }
  });
  
  return result;
});

// Ajouter un élément au contexte du projet actuel
export function addContextItem(item: Omit<ContextItem, 'id' | 'createdAt'>) {
  const id = `context-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const newItem: ContextItem = {
    ...item,
    id,
    createdAt: new Date(),
    pinned: item.pinned || false,
    metadata: item.metadata || {
      type: detectContentType(item.content),
      language: detectLanguage(item.filePath),
      tags: []
    }
  };
  
  contextItems.setKey(id, newItem);
  // Ouvrir automatiquement le panneau si c'est le premier élément
  if (Object.keys(contextItems.get()).length === 1) {
    openContextPanel();
  }
  return id;
}

// Supprimer un élément du contexte
export function removeContextItem(id: string) {
  logger.info(`Tentative de suppression de l'élément: ${id}`);
  const items = contextItems.get();
  logger.info(`Éléments avant suppression:`, Object.keys(items));
  
  if (!items[id]) {
    logger.warn(`Élément ${id} non trouvé dans le contexte`);
    return;
  }
  
  const newItems = { ...items };
  delete newItems[id];
  logger.info(`Éléments après suppression:`, Object.keys(newItems));
  
  contextItems.set(newItems);
  logger.info(`Suppression de l'élément ${id} terminée`);
}

// Vider tous les éléments du contexte sauf ceux qui sont épinglés
export function clearContextItems() {
  logger.info('Tentative de suppression des éléments non épinglés');
  const items = contextItems.get();
  logger.info(`Éléments avant suppression:`, Object.keys(items));
  
  const pinnedItems = Object.entries(items)
    .filter(([_, item]) => item.pinned)
    .reduce((acc, [id, item]) => ({ ...acc, [id]: item }), {});
  
  logger.info(`Éléments épinglés conservés:`, Object.keys(pinnedItems));
  contextItems.set(pinnedItems);
  logger.info('Suppression des éléments non épinglés terminée');
}

// Vider tous les éléments du contexte, y compris ceux qui sont épinglés
export function clearAllContextItems() {
  logger.info('Tentative de suppression de tous les éléments');
  const items = contextItems.get();
  logger.info(`Éléments avant suppression complète:`, Object.keys(items));
  
  contextItems.set({});
  logger.info('Suppression de tous les éléments terminée');
  // La sauvegarde est automatique grâce à l'écouteur sur contextItems
}

// Épingler/désépingler un élément
export function togglePinContextItem(id: string) {
  const items = contextItems.get();
  const item = items[id];
  
  if (item) {
    contextItems.setKey(id, {
      ...item,
      pinned: !item.pinned
    });
  }
}

// Mettre à jour les métadonnées d'un élément
export function updateContextItemMetadata(id: string, metadata: Partial<ContextItem['metadata']>) {
  const items = contextItems.get();
  const item = items[id];
  
  if (item) {
    contextItems.setKey(id, {
      ...item,
      metadata: {
        ...item.metadata,
        ...metadata
      }
    });
  }
}

// Ajouter un tag à un élément
export function addTagToContextItem(id: string, tag: string) {
  const items = contextItems.get();
  const item = items[id];
  
  if (item) {
    const currentTags = item.metadata?.tags || [];
    if (!currentTags.includes(tag)) {
      updateContextItemMetadata(id, {
        tags: [...currentTags, tag]
      });
    }
  }
}

// Détecter le type de contenu
function detectContentType(content: string): NonNullable<ContextItem['metadata']>['type'] {
  if (!content) return 'text';
  
  // Détection simple basée sur le contenu
  if (content.trim().startsWith('//') || content.trim().startsWith('/*') || content.trim().startsWith('#')) {
    return 'comment';
  }
  
  if (content.includes('function ') || content.includes('class ') || 
      content.includes('import ') || content.includes('export ') ||
      content.includes('{') || content.includes('}')) {
    return 'code';
  }
  
  if (content.toLowerCase().includes('error') || content.toLowerCase().includes('exception') ||
      content.toLowerCase().includes('failed') || content.toLowerCase().includes('warning')) {
    return 'error';
  }
  
  return 'text';
}

// Détecter le langage de programmation à partir de l'extension du fichier
function detectLanguage(filePath: string): string | undefined {
  if (!filePath) return undefined;
  
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'bash',
    'yml': 'yaml',
    'yaml': 'yaml',
    'xml': 'xml',
    'swift': 'swift',
    'kt': 'kotlin',
    'dart': 'dart',
  };
  
  return extension ? languageMap[extension] : undefined;
}

// Ouvrir le panneau de contexte
export function openContextPanel() {
  isContextPanelOpen.set(true);
}

// Fermer le panneau de contexte
export function closeContextPanel() {
  isContextPanelOpen.set(false);
}

// Basculer l'état du panneau de contexte
export function toggleContextPanel() {
  isContextPanelOpen.set(!isContextPanelOpen.get());
}
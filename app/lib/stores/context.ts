import { atom, map, computed } from 'nanostores';

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

// Store pour gérer les éléments de contexte
export const contextItems = map<Record<string, ContextItem>>({});

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

// Ajouter un élément au contexte
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
  const items = contextItems.get();
  const newItems = { ...items };
  delete newItems[id];
  contextItems.set(newItems);
}

// Vider tous les éléments du contexte sauf ceux qui sont épinglés
export function clearContextItems() {
  const items = contextItems.get();
  const pinnedItems = Object.entries(items)
    .filter(([_, item]) => item.pinned)
    .reduce((acc, [id, item]) => ({ ...acc, [id]: item }), {});
  
  contextItems.set(pinnedItems);
}

// Vider tous les éléments du contexte, y compris ceux qui sont épinglés
export function clearAllContextItems() {
  contextItems.set({});
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
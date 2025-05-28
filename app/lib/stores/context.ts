import { atom, map } from 'nanostores';

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
}

// Store pour gérer les éléments de contexte
export const contextItems = map<Record<string, ContextItem>>({}); 

// Store pour suivre si le panneau de contexte est ouvert
export const isContextPanelOpen = atom<boolean>(false);

// Ajouter un élément au contexte
export function addContextItem(item: Omit<ContextItem, 'id' | 'createdAt'>) {
  const id = `context-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const newItem: ContextItem = {
    ...item,
    id,
    createdAt: new Date(),
  };
  
  contextItems.setKey(id, newItem);
  return id;
}

// Supprimer un élément du contexte
export function removeContextItem(id: string) {
  const items = contextItems.get();
  const newItems = { ...items };
  delete newItems[id];
  contextItems.set(newItems);
}

// Vider tous les éléments du contexte
export function clearContextItems() {
  contextItems.set({});
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
import { atom, map } from 'nanostores';
import type { AgentProfile, AgentChatThread } from '~/utils/types';
import { agentService } from '~/lib/services/agentService';

// Store pour l'agent actuellement sélectionné
export const selectedAgentStore = atom<AgentProfile | null>(null);

// Store pour la liste de tous les agents
export const agentsListStore = atom<AgentProfile[]>([]);

// Store pour les threads de chat de l'agent sélectionné
export const agentThreadsStore = atom<AgentChatThread[]>([]);

// Store pour le thread de chat actuellement actif
export const activeThreadStore = atom<AgentChatThread | null>(null);

// Store pour l'état de chargement
export const agentsLoadingStore = atom<boolean>(false);

// Store pour les erreurs
export const agentsErrorStore = atom<string | null>(null);

/**
 * Charge la liste de tous les agents
 */
export async function loadAgents(): Promise<void> {
  try {
    agentsLoadingStore.set(true);
    agentsErrorStore.set(null);
    
    const agents = await agentService.listAgentProfiles();
    agentsListStore.set(agents);
    
    // Si aucun agent n'est sélectionné, sélectionner le premier par défaut
    if (!selectedAgentStore.get() && agents.length > 0) {
      await selectAgent(agents[0].id);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des agents:', error);
    agentsErrorStore.set('Erreur lors du chargement des agents');
  } finally {
    agentsLoadingStore.set(false);
  }
}

/**
 * Sélectionne un agent et charge ses threads
 */
export async function selectAgent(agentId: string): Promise<void> {
  try {
    agentsLoadingStore.set(true);
    agentsErrorStore.set(null);
    
    const agent = await agentService.getAgentProfile(agentId);
    if (!agent) {
      throw new Error(`Agent non trouvé: ${agentId}`);
    }
    
    selectedAgentStore.set(agent);
    
    // Charger les threads de cet agent
    const threads = await agentService.getAgentThreads(agentId);
    agentThreadsStore.set(threads);
    
    // Sélectionner le thread le plus récent ou créer un nouveau
    if (threads.length > 0) {
      const latestThread = threads.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];
      activeThreadStore.set(latestThread);
    } else {
      // Créer un nouveau thread
      await createNewThread(agentId);
    }
    
    // Sauvegarder la sélection dans localStorage
    localStorage.setItem('neurocode_selected_agent', agentId);
  } catch (error) {
    console.error('Erreur lors de la sélection de l\'agent:', error);
    agentsErrorStore.set('Erreur lors de la sélection de l\'agent');
  } finally {
    agentsLoadingStore.set(false);
  }
}

/**
 * Crée un nouveau thread pour l'agent sélectionné
 */
export async function createNewThread(agentId?: string): Promise<void> {
  const targetAgentId = agentId || selectedAgentStore.get()?.id;
  if (!targetAgentId) {
    throw new Error('Aucun agent sélectionné');
  }
  
  const newThread: AgentChatThread = {
    id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    agentId: targetAgentId,
    messages: [],
    title: 'Nouvelle conversation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  await agentService.saveAgentThread(newThread);
  
  // Mettre à jour les stores
  const currentThreads = agentThreadsStore.get();
  agentThreadsStore.set([newThread, ...currentThreads]);
  activeThreadStore.set(newThread);
}

/**
 * Sélectionne un thread spécifique
 */
export function selectThread(threadId: string): void {
  const threads = agentThreadsStore.get();
  const thread = threads.find(t => t.id === threadId);
  if (thread) {
    activeThreadStore.set(thread);
  }
}

/**
 * Met à jour le thread actif avec de nouveaux messages
 */
export async function updateActiveThread(messages: any[]): Promise<void> {
  const activeThread = activeThreadStore.get();
  if (!activeThread) {
    throw new Error('Aucun thread actif');
  }
  
  const updatedThread: AgentChatThread = {
    ...activeThread,
    messages,
    updatedAt: new Date().toISOString(),
  };
  
  await agentService.saveAgentThread(updatedThread);
  activeThreadStore.set(updatedThread);
  
  // Mettre à jour dans la liste des threads
  const threads = agentThreadsStore.get();
  const updatedThreads = threads.map(t => 
    t.id === updatedThread.id ? updatedThread : t
  );
  agentThreadsStore.set(updatedThreads);
}

/**
 * Crée un nouvel agent
 */
export async function createAgent(agentData: Omit<AgentProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  try {
    agentsLoadingStore.set(true);
    agentsErrorStore.set(null);
    
    const newAgent = await agentService.createAgentProfile(agentData);
    
    // Mettre à jour la liste des agents
    const currentAgents = agentsListStore.get();
    agentsListStore.set([...currentAgents, newAgent]);
    
    // Sélectionner le nouvel agent
    await selectAgent(newAgent.id);
  } catch (error) {
    console.error('Erreur lors de la création de l\'agent:', error);
    agentsErrorStore.set('Erreur lors de la création de l\'agent');
  } finally {
    agentsLoadingStore.set(false);
  }
}

/**
 * Met à jour un agent existant
 */
export async function updateAgent(agentId: string, updates: Partial<AgentProfile>): Promise<void> {
  try {
    agentsLoadingStore.set(true);
    agentsErrorStore.set(null);
    
    const updatedAgent = await agentService.updateAgentProfile(agentId, updates);
    if (!updatedAgent) {
      throw new Error('Agent non trouvé');
    }
    
    // Mettre à jour la liste des agents
    const currentAgents = agentsListStore.get();
    const updatedAgents = currentAgents.map(agent => 
      agent.id === agentId ? updatedAgent : agent
    );
    agentsListStore.set(updatedAgents);
    
    // Mettre à jour l'agent sélectionné si c'est le même
    if (selectedAgentStore.get()?.id === agentId) {
      selectedAgentStore.set(updatedAgent);
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'agent:', error);
    agentsErrorStore.set('Erreur lors de la mise à jour de l\'agent');
  } finally {
    agentsLoadingStore.set(false);
  }
}

/**
 * Supprime un agent
 */
export async function deleteAgent(agentId: string): Promise<void> {
  try {
    agentsLoadingStore.set(true);
    agentsErrorStore.set(null);
    
    const success = await agentService.deleteAgentProfile(agentId);
    if (!success) {
      throw new Error('Impossible de supprimer cet agent');
    }
    
    // Mettre à jour la liste des agents
    const currentAgents = agentsListStore.get();
    const filteredAgents = currentAgents.filter(agent => agent.id !== agentId);
    agentsListStore.set(filteredAgents);
    
    // Si l'agent supprimé était sélectionné, sélectionner un autre
    if (selectedAgentStore.get()?.id === agentId) {
      if (filteredAgents.length > 0) {
        await selectAgent(filteredAgents[0].id);
      } else {
        selectedAgentStore.set(null);
        agentThreadsStore.set([]);
        activeThreadStore.set(null);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'agent:', error);
    agentsErrorStore.set('Erreur lors de la suppression de l\'agent');
  } finally {
    agentsLoadingStore.set(false);
  }
}

/**
 * Initialise le store des agents
 */
export async function initializeAgents(): Promise<void> {
  await loadAgents();
  
  // Restaurer l'agent sélectionné depuis localStorage
  const savedAgentId = localStorage.getItem('neurocode_selected_agent');
  if (savedAgentId) {
    const agents = agentsListStore.get();
    const savedAgent = agents.find(agent => agent.id === savedAgentId);
    if (savedAgent) {
      await selectAgent(savedAgentId);
    }
  }
}
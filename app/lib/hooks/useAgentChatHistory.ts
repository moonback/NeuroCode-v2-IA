import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import type { Message } from 'ai';
import { toast } from 'react-toastify';
import { 
  selectedAgentStore, 
  activeThreadStore, 
  agentThreadsStore,
  selectThread,
  createNewThread
} from '~/lib/stores/agents';
import { agentService } from '~/lib/services/agentService';
import type { AgentChatThread } from '~/utils/types';

export function useAgentChatHistory() {
  const selectedAgent = useStore(selectedAgentStore);
  const activeThread = useStore(activeThreadStore);
  const agentThreads = useStore(agentThreadsStore);
  
  const [ready, setReady] = useState(false);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);

  // Charger les messages du thread actif
  useEffect(() => {
    if (activeThread) {
      setInitialMessages(activeThread.messages);
      setReady(true);
    } else if (selectedAgent) {
      // Si aucun thread actif mais un agent sélectionné, créer un nouveau thread
      createNewThread()
        .then(() => setReady(true))
        .catch((error) => {
          console.error('Erreur lors de la création du thread:', error);
          toast.error('Erreur lors de la création du thread');
          setReady(true);
        });
    } else {
      setInitialMessages([]);
      setReady(true);
    }
  }, [selectedAgent, activeThread]);

  // Sauvegarder l'historique des messages
  const storeMessageHistory = useCallback(async (messages: Message[]) => {
    if (!selectedAgent || !activeThread) {
      return;
    }

    try {
      const updatedThread: AgentChatThread = {
        ...activeThread,
        messages,
        lastMessageAt: new Date().toISOString()
      };

      await agentService.saveAgentThread(updatedThread);
      // Mettre à jour les stores directement pour éviter la double sauvegarde
      activeThreadStore.set(updatedThread);
      
      // Mettre à jour dans la liste des threads
      const threads = agentThreadsStore.get();
      const updatedThreads = threads.map(t => 
        t.id === updatedThread.id ? updatedThread : t
      );
      agentThreadsStore.set(updatedThreads);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde des messages');
    }
  }, [selectedAgent, activeThread]);

  // Créer un nouveau thread
  const createNewChat = useCallback(async () => {
    if (!selectedAgent) {
      toast.error('Aucun agent sélectionné');
      return;
    }

    try {
      await createNewThread();
      toast.success('Nouveau thread créé');
    } catch (error) {
      console.error('Erreur lors de la création du thread:', error);
      toast.error('Erreur lors de la création du thread');
    }
  }, [selectedAgent]);

  // Changer de thread
  const switchToThread = useCallback(async (threadId: string) => {
    if (!selectedAgent) {
      return;
    }

    try {
      await selectThread(threadId);
    } catch (error) {
      console.error('Erreur lors du changement de thread:', error);
      toast.error('Erreur lors du changement de thread');
    }
  }, [selectedAgent]);

  // Supprimer un thread
  const deleteThread = useCallback(async (threadId: string) => {
    if (!selectedAgent) {
      return;
    }

    try {
      await agentService.deleteAgentThread(selectedAgent.id, threadId);
      
      // Si c'était le thread actif, créer un nouveau thread
      if (activeThread?.id === threadId) {
        await createNewThread();
      }
      
      toast.success('Thread supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression du thread');
    }
  }, [selectedAgent, activeThread]);

  // Obtenir le titre du thread actuel
  const getThreadTitle = useCallback(() => {
    if (!activeThread) {
      return 'Nouveau chat';
    }

    if (activeThread.title) {
      return activeThread.title;
    }

    // Générer un titre basé sur le premier message utilisateur
    const firstUserMessage = activeThread.messages.find(m => m.role === 'user');
    if (firstUserMessage) {
      const content = firstUserMessage.content;
      if (typeof content === 'string') {
        return content.slice(0, 50) + (content.length > 50 ? '...' : '');
      }
    }

    return `Thread ${activeThread.id.slice(0, 8)}`;
  }, [activeThread]);

  // Obtenir le contexte de l'agent pour les prompts
  const getAgentContext = useCallback(() => {
    if (!selectedAgent) {
      return null;
    }

    return {
      agentId: selectedAgent.id,
      agentName: selectedAgent.name,
      initialPrompt: selectedAgent.initialPrompt,
      model: selectedAgent.model,
      tools: selectedAgent.tools || []
    };
  }, [selectedAgent]);

  return {
    ready,
    initialMessages,
    selectedAgent,
    activeThread,
    agentThreads,
    storeMessageHistory,
    createNewChat,
    switchToThread,
    deleteThread,
    getThreadTitle,
    getAgentContext
  };
}
import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { generateId, type Message } from 'ai';
import { toast } from 'react-toastify';
import {
  selectedAgentStore,
  activeThreadStore,
  agentThreadsStore,
  selectThread
} from '~/lib/stores/agents';
import { agentService } from '~/lib/services/agentService';
import type { AgentChatThread } from '~/utils/types';

export interface AgentChatHistoryItem {
  id: string;
  agentId: string;
  title?: string;
  messages: Message[];
  lastMessageAt?: string;
  createdAt: string;
}

export function useAgentChatHistory() {
  const selectedAgent = useStore(selectedAgentStore);
  const activeThread = useStore(activeThreadStore);
  const agentThreads = useStore(agentThreadsStore);
  
  const [ready, setReady] = useState<boolean>(false);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);

  // Initialize when agent or thread changes
  useEffect(() => {
    if (activeThread && activeThread.messages) {
      setInitialMessages(activeThread.messages);
    } else {
      setInitialMessages([]);
    }
    setReady(true);
  }, [activeThread]);

  // Save messages to the active thread
  const saveMessages = useCallback(async (messages: Message[]) => {
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
      
      // Update stores directly to avoid infinite loop
      activeThreadStore.set({ ...activeThread, messages });
      activeThreadStore.set({ ...activeThread, lastMessageAt: updatedThread.lastMessageAt });
      
      // Update the thread in the threads list
      const currentThreads = agentThreadsStore.get();
      const updatedThreads = currentThreads.map(thread => 
        thread.id === updatedThread.id ? updatedThread : thread
      );
      agentThreadsStore.set(updatedThreads);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des messages:', error);
      toast.error('Erreur lors de la sauvegarde des messages');
    }
  }, [selectedAgent, activeThread]);

  // Create a new thread
  const createNewThread = useCallback(async () => {
    if (!selectedAgent) {
      toast.error('Aucun agent sélectionné');
      return;
    }

    try {
      const newThread: AgentChatThread = {
        id: generateId(),
        agentId: selectedAgent.id,
        title: 'Nouvelle conversation',
        messages: [],
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: ''
      };

      await agentService.saveAgentThread(newThread);
      await selectThread(newThread.id);
      
      toast.success('Nouvelle conversation créée');
    } catch (error) {
      console.error('Erreur lors de la création du thread:', error);
      toast.error('Erreur lors de la création de la conversation');
    }
  }, [selectedAgent]);

  // Switch to a different thread
  const switchToThread = useCallback(async (threadId: string) => {
    if (!selectedAgent) {
      return;
    }

    try {
      await selectThread(threadId);
    } catch (error) {
      console.error('Erreur lors du changement de thread:', error);
      toast.error('Erreur lors du changement de conversation');
    }
  }, [selectedAgent]);

  // Delete a thread
  const deleteThread = useCallback(async (threadId: string) => {
    if (!selectedAgent) {
      return;
    }

    try {
      await agentService.deleteAgentThread(selectedAgent.id, threadId);
      
      // If we deleted the active thread, switch to another one or create new
      if (activeThread?.id === threadId) {
        const remainingThreads = agentThreads.filter(t => t.id !== threadId);
        if (remainingThreads.length > 0) {
          await selectThread(remainingThreads[0].id);
        } else {
          await createNewThread();
        }
      }
      
      toast.success('Conversation supprimée');
    } catch (error) {
      console.error('Erreur lors de la suppression du thread:', error);
      toast.error('Erreur lors de la suppression de la conversation');
    }
  }, [selectedAgent, activeThread, agentThreads, createNewThread]);

  // Get chat history for the current agent
  const getChatHistory = useCallback((): AgentChatHistoryItem[] => {
    if (!selectedAgent) {
      return [];
    }

    return agentThreads.map(thread => ({
      id: thread.id,
      agentId: thread.agentId,
      title: thread.title,
      messages: thread.messages,
      lastMessageAt: thread.lastMessageAt,
      createdAt: thread.createdAt
    }));
  }, [selectedAgent, agentThreads]);

  // Get agent context for prompts
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
    saveMessages,
    storeMessageHistory: saveMessages, // Alias for compatibility
    createNewThread,
    switchToThread,
    deleteThread,
    getChatHistory,
    getAgentContext
  };
}
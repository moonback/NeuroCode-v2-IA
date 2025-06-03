import type { AgentProfile, AgentChatThread } from '~/utils/types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('AgentsAPI');

// Types pour les réponses API
interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  [key: string]: T | boolean | string | undefined;
}

interface AgentsResponse {
  agents: AgentProfile[];
}

interface AgentResponse {
  agent: AgentProfile;
}

interface ThreadsResponse {
  threads: AgentChatThread[];
}

interface ThreadResponse {
  thread: AgentChatThread;
}

interface SuccessResponse {
  success: boolean;
}

class AgentsAPI {
  private baseUrl = '/api/agents';

  /**
   * Récupère tous les agents
   */
  async getAgents(): Promise<AgentProfile[]> {
    try {
      const response = await fetch(this.baseUrl);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json() as AgentsResponse;
      return data.agents;
    } catch (error) {
      logger.error('Erreur lors de la récupération des agents:', error);
      throw error;
    }
  }

  /**
   * Récupère un agent par son ID
   */
  async getAgent(id: string): Promise<AgentProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Agent non trouvé');
        }
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json() as AgentResponse;
      return data.agent;
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'agent:', error);
      throw error;
    }
  }

  /**
   * Crée un nouvel agent
   */
  async createAgent(agentData: Omit<AgentProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentProfile> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<any>;
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json() as AgentResponse;
      return data.agent;
    } catch (error) {
      logger.error('Erreur lors de la création de l\'agent:', error);
      throw error;
    }
  }

  /**
   * Met à jour un agent existant
   */
  async updateAgent(id: string, updates: Partial<AgentProfile>): Promise<AgentProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<any>;
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json() as AgentResponse;
      return data.agent;
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de l\'agent:', error);
      throw error;
    }
  }

  /**
   * Supprime un agent
   */
  async deleteAgent(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<any>;
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json() as SuccessResponse;
      return data.success;
    } catch (error) {
      logger.error('Erreur lors de la suppression de l\'agent:', error);
      throw error;
    }
  }

  /**
   * Récupère les threads d'un agent
   */
  async getAgentThreads(agentId: string): Promise<AgentChatThread[]> {
    try {
      const response = await fetch(`${this.baseUrl}/threads?agentId=${encodeURIComponent(agentId)}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json() as ThreadsResponse;
      return data.threads;
    } catch (error) {
      logger.error('Erreur lors de la récupération des threads:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau thread pour un agent
   */
  async createAgentThread(agentId: string, title?: string): Promise<AgentChatThread> {
    try {
      const response = await fetch(`${this.baseUrl}/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId, title }),
      });
      
      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<any>;
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json() as ThreadResponse;
      return data.thread;
    } catch (error) {
      logger.error('Erreur lors de la création du thread:', error);
      throw error;
    }
  }

  /**
   * Sauvegarde un thread d'agent
   */
  async saveAgentThread(thread: AgentChatThread): Promise<AgentChatThread> {
    try {
      const response = await fetch(`${this.baseUrl}/threads`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(thread),
      });
      
      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<any>;
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json() as ThreadResponse;
      return data.thread;
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde du thread:', error);
      throw error;
    }
  }

  /**
   * Supprime un thread d'agent
   */
  async deleteAgentThread(agentId: string, threadId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/threads`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agentId, threadId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json() as ApiResponse<any>;
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json() as SuccessResponse;
      return data.success;
    } catch (error) {
      logger.error('Erreur lors de la suppression du thread:', error);
      throw error;
    }
  }
}

// Instance singleton
export const agentsApi = new AgentsAPI();
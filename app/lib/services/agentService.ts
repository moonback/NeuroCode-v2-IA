import type { AgentProfile, AgentChatThread } from '~/utils/types';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('AgentService');

// Agents prédéfinis
const DEFAULT_AGENTS: AgentProfile[] = [
  {
    id: 'code_agent',
    name: 'Agent Codeur',
    description: 'Expert en développement et analyse de code',
    initialPrompt: `Vous êtes un agent IA expert en développement logiciel. Votre rôle est d'analyser le code, identifier les problèmes, suggérer des améliorations et aider à l'implémentation de nouvelles fonctionnalités. Vous maîtrisez plusieurs langages de programmation et les meilleures pratiques de développement.`,
    model: 'llama3.2:latest',
    provider: 'ollama',
    tools: ['file_system', 'git', 'terminal'],
    avatar: '👨‍💻',
    color: '#3B82F6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'doc_agent',
    name: 'Agent Documenteur',
    description: 'Spécialisé dans la rédaction et la documentation',
    initialPrompt: `Vous êtes un agent IA spécialisé dans la rédaction de documentation technique. Votre mission est de créer des documentations claires, complètes et bien structurées pour les projets de développement. Vous excellez dans la rédaction de README, de guides d'utilisation et de documentation API.`,
    model: 'llama3.2:latest',
    provider: 'ollama',
    tools: ['file_system'],
    avatar: '📝',
    color: '#10B981',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'debug_agent',
    name: 'Agent Débogueur',
    description: 'Expert en résolution de bugs et optimisation',
    initialPrompt: `Vous êtes un agent IA expert en débogage et résolution de problèmes. Votre rôle est d'identifier les bugs, analyser les erreurs, proposer des solutions et optimiser les performances du code. Vous êtes méthodique et précis dans votre approche de résolution de problèmes.`,
    model: 'llama3.2:latest',
    provider: 'ollama',
    tools: ['file_system', 'terminal', 'debug'],
    avatar: '🐛',
    color: '#EF4444',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ui_agent',
    name: 'Agent UI/UX',
    description: 'Spécialisé dans le design et l\'expérience utilisateur',
    initialPrompt: `Vous êtes un agent IA expert en design UI/UX. Votre mission est d'améliorer l'interface utilisateur, proposer des améliorations d'expérience utilisateur et créer des interfaces modernes et intuitives. Vous maîtrisez les principes de design, l'accessibilité et les tendances actuelles.`,
    model: 'llama3.2:latest',
    provider: 'ollama',
    tools: ['file_system'],
    avatar: '🎨',
    color: '#8B5CF6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class AgentService {
  private storageKey = 'neurocode_agents';
  private threadsStorageKey = 'neurocode_agent_threads';

  /**
   * Récupère tous les profils d'agents
   */
  async listAgentProfiles(): Promise<AgentProfile[]> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const agents = JSON.parse(stored) as AgentProfile[];
        // Fusionner avec les agents par défaut si nécessaire
        const defaultIds = DEFAULT_AGENTS.map(a => a.id);
        const customAgents = agents.filter(a => !defaultIds.includes(a.id));
        return [...DEFAULT_AGENTS, ...customAgents];
      }
      // Première utilisation, retourner les agents par défaut
      await this.saveAgents(DEFAULT_AGENTS);
      return DEFAULT_AGENTS;
    } catch (error) {
      logger.error('Erreur lors de la récupération des agents:', error);
      return DEFAULT_AGENTS;
    }
  }

  /**
   * Récupère un profil d'agent par son ID
   */
  async getAgentProfile(id: string): Promise<AgentProfile | null> {
    const agents = await this.listAgentProfiles();
    return agents.find(agent => agent.id === id) || null;
  }

  /**
   * Crée un nouveau profil d'agent
   */
  async createAgentProfile(agent: Omit<AgentProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgentProfile> {
    const newAgent: AgentProfile = {
      ...agent,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const agents = await this.listAgentProfiles();
    agents.push(newAgent);
    await this.saveAgents(agents);

    logger.info('Agent créé:', newAgent.id);
    return newAgent;
  }

  /**
   * Met à jour un profil d'agent
   */
  async updateAgentProfile(id: string, updates: Partial<AgentProfile>): Promise<AgentProfile | null> {
    const agents = await this.listAgentProfiles();
    const index = agents.findIndex(agent => agent.id === id);
    
    if (index === -1) {
      logger.error('Agent non trouvé:', id);
      return null;
    }

    agents[index] = {
      ...agents[index],
      ...updates,
      id, // Préserver l'ID
      updatedAt: new Date().toISOString(),
    };

    await this.saveAgents(agents);
    logger.info('Agent mis à jour:', id);
    return agents[index];
  }

  /**
   * Supprime un profil d'agent
   */
  async deleteAgentProfile(id: string): Promise<boolean> {
    // Empêcher la suppression des agents par défaut
    if (DEFAULT_AGENTS.some(agent => agent.id === id)) {
      logger.warn('Tentative de suppression d\'un agent par défaut:', id);
      return false;
    }

    const agents = await this.listAgentProfiles();
    const filteredAgents = agents.filter(agent => agent.id !== id);
    
    if (filteredAgents.length === agents.length) {
      logger.error('Agent non trouvé pour suppression:', id);
      return false;
    }

    await this.saveAgents(filteredAgents);
    // Supprimer aussi les threads associés
    await this.deleteAgentThreads(id);
    
    logger.info('Agent supprimé:', id);
    return true;
  }

  /**
   * Récupère les threads de chat pour un agent
   */
  async getAgentThreads(agentId: string): Promise<AgentChatThread[]> {
    try {
      const stored = localStorage.getItem(this.threadsStorageKey);
      if (stored) {
        const allThreads = JSON.parse(stored) as AgentChatThread[];
        return allThreads.filter(thread => thread.agentId === agentId);
      }
      return [];
    } catch (error) {
      logger.error('Erreur lors de la récupération des threads:', error);
      return [];
    }
  }

  /**
   * Sauvegarde un thread de chat pour un agent
   */
  async saveAgentThread(thread: AgentChatThread): Promise<void> {
    try {
      const stored = localStorage.getItem(this.threadsStorageKey);
      const allThreads = stored ? JSON.parse(stored) as AgentChatThread[] : [];
      
      const existingIndex = allThreads.findIndex(t => t.id === thread.id);
      if (existingIndex >= 0) {
        allThreads[existingIndex] = { ...thread, updatedAt: new Date().toISOString() };
      } else {
        allThreads.push(thread);
      }

      localStorage.setItem(this.threadsStorageKey, JSON.stringify(allThreads));
      logger.info('Thread sauvegardé:', thread.id);
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde du thread:', error);
    }
  }

  /**
   * Supprime un thread spécifique d'un agent
   */
  async deleteAgentThread(agentId: string, threadId: string): Promise<boolean> {
    try {
      const stored = localStorage.getItem(this.threadsStorageKey);
      if (stored) {
        const allThreads = JSON.parse(stored) as AgentChatThread[];
        const filteredThreads = allThreads.filter(thread => !(thread.agentId === agentId && thread.id === threadId));
        
        if (filteredThreads.length === allThreads.length) {
          logger.error('Thread non trouvé pour suppression:', threadId);
          return false;
        }
        
        localStorage.setItem(this.threadsStorageKey, JSON.stringify(filteredThreads));
        logger.info('Thread supprimé:', threadId);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Erreur lors de la suppression du thread:', error);
      return false;
    }
  }

  /**
   * Supprime tous les threads d'un agent
   */
  private async deleteAgentThreads(agentId: string): Promise<void> {
    try {
      const stored = localStorage.getItem(this.threadsStorageKey);
      if (stored) {
        const allThreads = JSON.parse(stored) as AgentChatThread[];
        const filteredThreads = allThreads.filter(thread => thread.agentId !== agentId);
        localStorage.setItem(this.threadsStorageKey, JSON.stringify(filteredThreads));
      }
    } catch (error) {
      logger.error('Erreur lors de la suppression des threads:', error);
    }
  }

  /**
   * Sauvegarde la liste des agents
   */
  private async saveAgents(agents: AgentProfile[]): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(agents));
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde des agents:', error);
      throw error;
    }
  }

  /**
   * Génère un ID unique
   */
  private generateId(): string {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Instance singleton
export const agentService = new AgentService();
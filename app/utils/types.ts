// Ollama types
export interface OllamaModelDetails {
  parent_model: string;
  format: string;
  family: string;
  families: string[];
  parameter_size: string;
  quantization_level: string;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: OllamaModelDetails;
}

export interface OllamaApiResponse {
  models: OllamaModel[];
}

// Agent Profile types
export interface AgentProfile {
  id: string; // ID unique de l'agent (ex: 'code_agent', 'doc_agent')
  name: string; // Nom affichable de l'agent (ex: 'Agent Codeur', 'Agent Documenteur')
  description: string; // Courte description du rôle
  initialPrompt: string; // Le prompt initial qui définit le rôle et le contexte de l'agent
  model: string; // Le modèle LLM à utiliser pour cet agent
  provider: string; // Le fournisseur du modèle (ex: 'ollama', 'openai')
  tools?: string[]; // Liste des outils que cet agent peut utiliser
  avatar?: string; // Avatar de l'agent (optionnel)
  color?: string; // Couleur associée à l'agent (optionnel)
  createdAt: string; // Date de création
  updatedAt: string; // Date de dernière modification
}

// Agent Chat Thread types
export interface AgentChatThread {
  id: string;
  agentId: string;
  messages: any[]; // Type Message from 'ai'
  title?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
}

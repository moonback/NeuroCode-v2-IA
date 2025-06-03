export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  category: AgentCategory;
}

export type AgentCategory = 'development' | 'design' | 'data' | 'devops' | 'general';

export interface AgentSelectorProps {
  selectedAgent?: AgentInfo | null;
  setSelectedAgent?: (agent: AgentInfo | null) => void;
  agentList: AgentInfo[];
  disabled?: boolean;
}
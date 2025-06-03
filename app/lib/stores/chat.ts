import { map } from 'nanostores';
import { selectedAgentStore } from './agents';

export const chatStore = map({
  started: false,
  aborted: false,
  showChat: true,
});

// Fonction pour obtenir le contexte de l'agent actuel
export const getCurrentAgentContext = () => {
  const selectedAgent = selectedAgentStore.get();
  return selectedAgent ? {
    agentId: selectedAgent.id,
    agentName: selectedAgent.name,
    initialPrompt: selectedAgent.initialPrompt,
    model: selectedAgent.model,
    tools: selectedAgent.tools
  } : null;
};

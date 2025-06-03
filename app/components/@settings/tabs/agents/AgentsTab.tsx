import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AgentSelection, AgentConfiguration } from './index';
import type { AgentProfile } from '~/utils/types';

type ViewMode = 'selection' | 'configuration' | 'create';

export default function AgentsTab() {
  const [viewMode, setViewMode] = useState<ViewMode>('selection');
  const [editingAgent, setEditingAgent] = useState<AgentProfile | undefined>();

  const handleConfigureAgent = (agent: AgentProfile) => {
    setEditingAgent(agent);
    setViewMode('configuration');
  };

  const handleCreateAgent = () => {
    setEditingAgent(undefined);
    setViewMode('create');
  };

  const handleSave = () => {
    setEditingAgent(undefined);
    setViewMode('selection');
  };

  const handleCancel = () => {
    setEditingAgent(undefined);
    setViewMode('selection');
  };

  return (
    <div className="h-full overflow-hidden">
      <AnimatePresence mode="wait">
        {viewMode === 'selection' && (
          <AgentSelection
            key="selection"
            onConfigureAgent={handleConfigureAgent}
            onCreateAgent={handleCreateAgent}
          />
        )}
        {(viewMode === 'configuration' || viewMode === 'create') && (
          <AgentConfiguration
            key={viewMode}
            agent={editingAgent}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
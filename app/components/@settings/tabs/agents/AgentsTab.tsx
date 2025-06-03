import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AgentSelection, AgentConfiguration, AgentManagement, AgentDashboard } from './index';
import type { AgentProfile } from '~/utils/types';

type ViewMode = 'selection' | 'configuration' | 'create' | 'management' | 'dashboard';

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

  const handleManageAgents = () => {
    setViewMode('management');
  };

  const handleSave = () => {
    setEditingAgent(undefined);
    setViewMode('selection');
  };

  const handleCancel = () => {
    setEditingAgent(undefined);
    setViewMode('selection');
  };

  const handleBackToSelection = () => {
    setViewMode('selection');
    setEditingAgent(undefined);
  };

  const handleViewDashboard = () => {
    setViewMode('dashboard');
  };

  const handleViewAgent = (agent: AgentProfile) => {
    setEditingAgent(agent);
    setViewMode('configuration');
  };

  return (
    <div className="h-full overflow-hidden">
      <AnimatePresence mode="wait">
        {viewMode === 'selection' && (
          <AgentSelection
            key="selection"
            onConfigureAgent={handleConfigureAgent}
            onCreateAgent={handleCreateAgent}
            onManageAgents={handleManageAgents}
            onViewDashboard={handleViewDashboard}
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
        {viewMode === 'management' && (
          <AgentManagement
            key="management"
            onBack={handleBackToSelection}
          />
        )}
        {viewMode === 'dashboard' && (
          <AgentDashboard
            key="dashboard"
            onViewAgent={handleViewAgent}
            onBack={handleBackToSelection}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
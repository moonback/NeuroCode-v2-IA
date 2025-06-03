import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { 
  agentsListStore, 
  agentsLoadingStore,
  agentsErrorStore,
  initializeAgents
} from '~/lib/stores/agents';
import { agentsApi } from '~/lib/api/agentsApi';
import type { AgentProfile } from '~/utils/types';
import { toast } from 'react-toastify';

interface AgentManagementProps {
  onBack: () => void;
}

export default function AgentManagement({ onBack }: AgentManagementProps) {
  const agents = useStore(agentsListStore);
  const loading = useStore(agentsLoadingStore);
  const error = useStore(agentsErrorStore);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportData, setExportData] = useState<string>('');
  const [importData, setImportData] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    initializeAgents();
  }, []);

  const filteredAndSortedAgents = agents
    .filter(agent => 
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSelectAgent = (agentId: string) => {
    const newSelected = new Set(selectedAgents);
    if (newSelected.has(agentId)) {
      newSelected.delete(agentId);
    } else {
      newSelected.add(agentId);
    }
    setSelectedAgents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedAgents.size === filteredAndSortedAgents.length) {
      setSelectedAgents(new Set());
    } else {
      setSelectedAgents(new Set(filteredAndSortedAgents.map(agent => agent.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAgents.size === 0) return;
    
    const agentNames = agents
      .filter(agent => selectedAgents.has(agent.id))
      .map(agent => agent.name)
      .join(', ');
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${selectedAgents.size} agent(s) : ${agentNames} ?`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedAgents).map(agentId => 
        agentsApi.deleteAgent(agentId)
      );
      
      await Promise.all(deletePromises);
      setSelectedAgents(new Set());
      await initializeAgents();
      toast.success(`${selectedAgents.size} agent(s) supprimé(s)`);
    } catch (error) {
      toast.error('Erreur lors de la suppression des agents');
    }
  };

  const handleExport = () => {
    const agentsToExport = selectedAgents.size > 0 
      ? agents.filter(agent => selectedAgents.has(agent.id))
      : agents;
    
    const exportObject = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      agents: agentsToExport.map(agent => ({
        ...agent,
        id: undefined, // Retirer l'ID pour éviter les conflits lors de l'import
        createdAt: undefined,
        updatedAt: undefined
      }))
    };
    
    setExportData(JSON.stringify(exportObject, null, 2));
    setShowExportModal(true);
  };

  const handleDownloadExport = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neurocode-agents-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportModal(false);
    toast.success('Export téléchargé');
  };

  const handleImport = async () => {
    try {
      const importObject = JSON.parse(importData);
      
      if (!importObject.agents || !Array.isArray(importObject.agents)) {
        throw new Error('Format d\'import invalide');
      }
      
      const importPromises = importObject.agents.map((agentData: any) => 
        agentsApi.createAgent(agentData)
      );
      
      await Promise.all(importPromises);
      await initializeAgents();
      setShowImportModal(false);
      setImportData('');
      toast.success(`${importObject.agents.length} agent(s) importé(s)`);
    } catch (error) {
      toast.error('Erreur lors de l\'import : ' + (error instanceof Error ? error.message : 'Format invalide'));
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImportData(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  if (loading && agents.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-bolt-elements-textSecondary">
          <div className="i-ph:spinner animate-spin text-xl" />
          <span>Chargement des agents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
          >
            <div className="i-ph:arrow-left text-lg" />
            <span>Retour</span>
          </button>
          <div>
            <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">
              Gestion Avancée des Agents
            </h2>
            <p className="text-sm text-bolt-elements-textSecondary mt-1">
              Gérez vos agents en lot, importez et exportez vos configurations
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="i-ph:magnifying-glass text-bolt-elements-textSecondary" />
            </div>
            <input
              type="text"
              placeholder="Rechercher des agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-bolt-elements-borderColor rounded-lg bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary placeholder-bolt-elements-textSecondary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
            />
          </div>
          
          {/* Sort */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-bolt-elements-borderColor rounded-lg bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus"
            >
              <option value="name">Nom</option>
              <option value="createdAt">Date de création</option>
              <option value="updatedAt">Dernière modification</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-bolt-elements-borderColor rounded-lg bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-colors"
            >
              <div className={`i-ph:sort-${sortOrder === 'asc' ? 'ascending' : 'descending'}`} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-bolt-elements-borderColor rounded-lg bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-colors"
          >
            <div className="i-ph:download text-lg" />
            <span>Exporter</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-bolt-elements-borderColor rounded-lg bg-bolt-elements-background-depth-2 text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-colors"
          >
            <div className="i-ph:upload text-lg" />
            <span>Importer</span>
          </button>
          {selectedAgents.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <div className="i-ph:trash text-lg" />
              <span>Supprimer ({selectedAgents.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bolt-elements-background-depth-3">
              <tr>
                <th className="w-12 p-4">
                  <input
                    type="checkbox"
                    checked={selectedAgents.size === filteredAndSortedAgents.length && filteredAndSortedAgents.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-bolt-elements-borderColor"
                  />
                </th>
                <th className="text-left p-4 text-bolt-elements-textPrimary font-medium">Agent</th>
                <th className="text-left p-4 text-bolt-elements-textPrimary font-medium">Modèle</th>
                <th className="text-left p-4 text-bolt-elements-textPrimary font-medium">Fournisseur</th>
                <th className="text-left p-4 text-bolt-elements-textPrimary font-medium">Créé le</th>
                <th className="text-left p-4 text-bolt-elements-textPrimary font-medium">Modifié le</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedAgents.map((agent) => (
                <tr key={agent.id} className="border-t border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-1 transition-colors">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedAgents.has(agent.id)}
                      onChange={() => handleSelectAgent(agent.id)}
                      className="rounded border-bolt-elements-borderColor"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: agent.color || '#3B82F6' }}
                      >
                        {agent.avatar || agent.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-bolt-elements-textPrimary">{agent.name}</div>
                        <div className="text-sm text-bolt-elements-textSecondary">{agent.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-bolt-elements-textPrimary">{agent.model}</td>
                  <td className="p-4 text-bolt-elements-textPrimary">{agent.provider}</td>
                  <td className="p-4 text-bolt-elements-textSecondary">
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-bolt-elements-textSecondary">
                    {new Date(agent.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedAgents.length === 0 && (
          <div className="p-8 text-center text-bolt-elements-textSecondary">
            {searchTerm ? 'Aucun agent trouvé pour cette recherche' : 'Aucun agent disponible'}
          </div>
        )}
      </div>

      {/* Export Modal */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowExportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">Exporter les Agents</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
                >
                  <div className="i-ph:x text-xl" />
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden">
                <textarea
                  value={exportData}
                  readOnly
                  className="w-full h-64 p-3 border border-bolt-elements-borderColor rounded-lg bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary font-mono text-sm resize-none"
                />
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleDownloadExport}
                  className="flex-1 px-4 py-2 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded-lg hover:bg-bolt-elements-button-primary-backgroundHover transition-colors"
                >
                  Télécharger
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bolt-elements-background-depth-2 rounded-lg border border-bolt-elements-borderColor p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">Importer des Agents</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
                >
                  <div className="i-ph:x text-xl" />
                </button>
              </div>
              
              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                    Importer depuis un fichier
                  </label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="w-full p-2 border border-bolt-elements-borderColor rounded-lg bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary"
                  />
                </div>
                
                <div className="text-center text-bolt-elements-textSecondary">ou</div>
                
                <div>
                  <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                    Coller les données JSON
                  </label>
                  <textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder="Collez ici les données JSON d'export..."
                    className="w-full h-48 p-3 border border-bolt-elements-borderColor rounded-lg bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary font-mono text-sm resize-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleImport}
                  disabled={!importData.trim()}
                  className="flex-1 px-4 py-2 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded-lg hover:bg-bolt-elements-button-primary-backgroundHover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Importer
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportData('');
                  }}
                  className="px-4 py-2 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
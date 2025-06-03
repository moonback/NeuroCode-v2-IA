import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import { createAgent, updateAgent } from '~/lib/stores/agents';
import type { AgentProfile } from '~/utils/types';
import { toast } from 'react-toastify';
import { stripIndents } from '~/utils/stripIndent';

interface AgentConfigurationProps {
  agent?: AgentProfile;
  onSave: () => void;
  onCancel: () => void;
}

const AVAILABLE_TOOLS = [
  'file_system',
  'git',
  'terminal',
  'web_search',
  'code_analysis',
  'documentation',
  'testing',
  'debugging'
];

const AVAILABLE_MODELS = [
  'llama3.2:latest',
  'llama3.1:latest',
  'codellama:latest',
  'mistral:latest',
  'phi3:latest'
];

const AGENT_AVATARS = ['🤖', '👨‍💻', '📚', '🔧', '🎨', '🧠', '⚡', '🔍', '💡', '🚀'];
const AGENT_COLORS = ['#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function AgentConfiguration({ agent, onSave, onCancel }: AgentConfigurationProps) {
  const [formData, setFormData] = useState({
    name: agent?.name || '',
    description: agent?.description || '',
    initialPrompt: agent?.initialPrompt || '',
    model: agent?.model || 'llama3.2:latest',
    tools: agent?.tools || [],
    avatar: agent?.avatar || '🤖',
    color: agent?.color || '#6B7280'
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!agent;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (!formData.initialPrompt.trim()) {
      newErrors.initialPrompt = 'Le prompt initial est requis';
    }

    if (!formData.model) {
      newErrors.model = 'Le modèle est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const agentData: Omit<AgentProfile, 'id'> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        initialPrompt: stripIndents(formData.initialPrompt),
        model: formData.model,
        tools: formData.tools,
        avatar: formData.avatar,
        color: formData.color,
        provider: '',
        createdAt: '',
        updatedAt: ''
      };

      if (isEditing && agent) {
        await updateAgent(agent.id, agentData);
        toast.success('Agent mis à jour');
      } else {
        await createAgent(agentData);
        toast.success('Agent créé');
      }

      onSave();
    } catch (error) {
      toast.error(isEditing ? 'Erreur lors de la mise à jour' : 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const handleToolToggle = (tool: string) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter(t => t !== tool)
        : [...prev.tools, tool]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-bolt-elements-textPrimary">
            {isEditing ? 'Modifier l\'agent' : 'Créer un nouvel agent'}
          </h2>
          <p className="text-sm text-bolt-elements-textSecondary mt-1">
            {isEditing ? 'Modifiez les paramètres de votre agent' : 'Configurez votre nouvel agent IA'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-bolt-elements-background-depth-3 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
        >
          <div className="i-ph:x text-xl" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary">
            Informations de base
          </h3>

          {/* Avatar and Color Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                Avatar
              </label>
              <div className="grid grid-cols-5 gap-2">
                {AGENT_AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, avatar }))}
                    className={classNames(
                      'w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all',
                      formData.avatar === avatar
                        ? 'bg-bolt-elements-button-primary-background text-white'
                        : 'bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-background-depth-2'
                    )}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                Couleur
              </label>
              <div className="grid grid-cols-4 gap-2">
                {AGENT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={classNames(
                      'w-10 h-10 rounded-lg transition-all border-2',
                      formData.color === color
                        ? 'border-bolt-elements-textPrimary'
                        : 'border-transparent hover:border-bolt-elements-borderColor'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
              Nom de l'agent *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={classNames(
                'w-full px-3 py-2 rounded-lg border transition-colors',
                'bg-bolt-elements-background-depth-1',
                'text-bolt-elements-textPrimary',
                'placeholder-bolt-elements-textTertiary',
                errors.name
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-bolt-elements-borderColor focus:border-bolt-elements-button-primary-background',
                'focus:outline-none focus:ring-2 focus:ring-bolt-elements-button-primary-background/20'
              )}
              placeholder="Ex: Agent Codeur"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className={classNames(
                'w-full px-3 py-2 rounded-lg border transition-colors resize-none',
                'bg-bolt-elements-background-depth-1',
                'text-bolt-elements-textPrimary',
                'placeholder-bolt-elements-textTertiary',
                errors.description
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-bolt-elements-borderColor focus:border-bolt-elements-button-primary-background',
                'focus:outline-none focus:ring-2 focus:ring-bolt-elements-button-primary-background/20'
              )}
              placeholder="Décrivez le rôle et les capacités de cet agent..."
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
              Modèle LLM *
            </label>
            <select
              value={formData.model}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              className={classNames(
                'w-full px-3 py-2 rounded-lg border transition-colors',
                'bg-bolt-elements-background-depth-1',
                'text-bolt-elements-textPrimary',
                errors.model
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-bolt-elements-borderColor focus:border-bolt-elements-button-primary-background',
                'focus:outline-none focus:ring-2 focus:ring-bolt-elements-button-primary-background/20'
              )}
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            {errors.model && (
              <p className="text-red-500 text-sm mt-1">{errors.model}</p>
            )}
          </div>
        </div>

        {/* Initial Prompt */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary">
            Prompt initial
          </h3>
          <div>
            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
              Instructions système *
            </label>
            <textarea
              value={formData.initialPrompt}
              onChange={(e) => setFormData(prev => ({ ...prev, initialPrompt: e.target.value }))}
              rows={8}
              className={classNames(
                'w-full px-3 py-2 rounded-lg border transition-colors resize-none font-mono text-sm',
                'bg-bolt-elements-background-depth-1',
                'text-bolt-elements-textPrimary',
                'placeholder-bolt-elements-textTertiary',
                errors.initialPrompt
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-bolt-elements-borderColor focus:border-bolt-elements-button-primary-background',
                'focus:outline-none focus:ring-2 focus:ring-bolt-elements-button-primary-background/20'
              )}
              placeholder={`Vous êtes un agent IA spécialisé en...

Votre rôle est de...

Vous devez toujours...`}
            />
            {errors.initialPrompt && (
              <p className="text-red-500 text-sm mt-1">{errors.initialPrompt}</p>
            )}
            <p className="text-xs text-bolt-elements-textTertiary mt-1">
              Ce prompt sera utilisé pour définir le comportement et le contexte de l'agent
            </p>
          </div>
        </div>

        {/* Tools */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-bolt-elements-textPrimary">
            Outils disponibles
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AVAILABLE_TOOLS.map((tool) => (
              <label
                key={tool}
                className={classNames(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                  formData.tools.includes(tool)
                    ? 'border-bolt-elements-button-primary-background bg-bolt-elements-button-primary-background/5'
                    : 'border-bolt-elements-borderColor hover:border-bolt-elements-button-primary-background/50'
                )}
              >
                <input
                  type="checkbox"
                  checked={formData.tools.includes(tool)}
                  onChange={() => handleToolToggle(tool)}
                  className="sr-only"
                />
                <div
                  className={classNames(
                    'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                    formData.tools.includes(tool)
                      ? 'border-bolt-elements-button-primary-background bg-bolt-elements-button-primary-background'
                      : 'border-bolt-elements-borderColor'
                  )}
                >
                  {formData.tools.includes(tool) && (
                    <div className="i-ph:check text-white text-xs" />
                  )}
                </div>
                <span className="text-sm text-bolt-elements-textPrimary capitalize">
                  {tool.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-bolt-elements-borderColor">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary hover:border-bolt-elements-textSecondary transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className={classNames(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-bolt-elements-button-primary-background',
              'text-bolt-elements-button-primary-text',
              'hover:bg-bolt-elements-button-primary-backgroundHover',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-200'
            )}
          >
            {saving && <div className="i-ph:spinner animate-spin" />}
            <span>{isEditing ? 'Mettre à jour' : 'Créer l\'agent'}</span>
          </button>
        </div>
      </form>
    </motion.div>
  );
}
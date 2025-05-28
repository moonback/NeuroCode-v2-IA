import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { Button } from '~/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '~/components/ui/Card';
import { PromptLibrary } from '~/lib/common/prompt-library';
import { useSettings } from '~/lib/hooks/useSettings';

interface CustomPrompt {
  id: string;
  label: string;
  description: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export default function CustomPromptsTab() {
  const { promptId, setPromptId } = useSettings();
  const [customPrompts, setCustomPrompts] = useState<CustomPrompt[]>([]);
  const [newPrompt, setNewPrompt] = useState<Partial<CustomPrompt>>({
    label: '',
    description: '',
    content: '',
  });
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Charger les prompts personnalisés depuis le localStorage
  useEffect(() => {
    const savedPrompts = localStorage.getItem('bolt_custom_prompts');
    if (savedPrompts) {
      try {
        setCustomPrompts(JSON.parse(savedPrompts));
      } catch (error) {
        console.error('Erreur lors du chargement des prompts personnalisés:', error);
        toast.error('Erreur lors du chargement des prompts personnalisés');
      }
    }
  }, []);
  
  // Vérifier si le prompt actif est un prompt personnalisé au chargement
  useEffect(() => {
    if (promptId && promptId.startsWith('custom_')) {
      const customPrompt = customPrompts.find(p => p.id === promptId);
      if (!customPrompt) {
        // Si le prompt personnalisé n'existe plus, revenir au prompt par défaut
        setPromptId('default');
        toast.info('Le prompt personnalisé sélectionné n\'existe plus, retour au prompt par défaut');
      }
    }
  }, [promptId, customPrompts, setPromptId]);

  // Sauvegarder les prompts personnalisés dans le localStorage
  const saveCustomPrompts = (prompts: CustomPrompt[]) => {
    try {
      localStorage.setItem('bolt_custom_prompts', JSON.stringify(prompts));
      setCustomPrompts(prompts);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des prompts personnalisés:', error);
      toast.error('Erreur lors de la sauvegarde des prompts personnalisés');
    }
  };

  // Ajouter un nouveau prompt personnalisé
  const handleAddPrompt = () => {
    if (!newPrompt.label || !newPrompt.content) {
      toast.error('Le titre et le contenu sont requis');
      return;
    }

    const timestamp = Date.now();
    const promptToAdd: CustomPrompt = {
      id: `custom_${timestamp}`,
      label: newPrompt.label,
      description: newPrompt.description || 'Prompt personnalisé',
      content: newPrompt.content,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const updatedPrompts = [...customPrompts, promptToAdd];
    saveCustomPrompts(updatedPrompts);
    
    // Réinitialiser le formulaire
    setNewPrompt({
      label: '',
      description: '',
      content: '',
    });
    setShowAddForm(false);
    toast.success('Prompt personnalisé ajouté avec succès');
  };

  // Supprimer un prompt personnalisé
  const handleDeletePrompt = (id: string) => {
    const updatedPrompts = customPrompts.filter(prompt => prompt.id !== id);
    saveCustomPrompts(updatedPrompts);
    toast.success('Prompt personnalisé supprimé avec succès');
    
    // Si le prompt supprimé était sélectionné, revenir au prompt par défaut
    if (promptId === id) {
      setPromptId('default');
    }
  };

  // Commencer l'édition d'un prompt
  const handleStartEdit = (prompt: CustomPrompt) => {
    setEditingPromptId(prompt.id);
    setNewPrompt({
      label: prompt.label,
      description: prompt.description,
      content: prompt.content,
    });
    setShowAddForm(true);
  };

  // Mettre à jour un prompt existant
  const handleUpdatePrompt = () => {
    if (!editingPromptId || !newPrompt.label || !newPrompt.content) {
      toast.error('Le titre et le contenu sont requis');
      return;
    }

    const updatedPrompts = customPrompts.map(prompt => {
      if (prompt.id === editingPromptId) {
        return {
          ...prompt,
          label: newPrompt.label!, // Utilisation de l'assertion non-null car on a vérifié plus haut
          description: newPrompt.description || prompt.description,
          content: newPrompt.content!, // Utilisation de l'assertion non-null car on a vérifié plus haut
          updatedAt: Date.now(),
        };
      }
      return prompt;
    });

    saveCustomPrompts(updatedPrompts);
    setEditingPromptId(null);
    setNewPrompt({
      label: '',
      description: '',
      content: '',
    });
    setShowAddForm(false);
    toast.success('Prompt personnalisé mis à jour avec succès');
  };

  // Sélectionner un prompt comme prompt actif
  const handleSelectPrompt = (id: string) => {
    setPromptId(id);
    toast.success('Prompt sélectionné avec succès');
  };

  // Annuler l'ajout ou l'édition
  const handleCancel = () => {
    setEditingPromptId(null);
    setNewPrompt({
      label: '',
      description: '',
      content: '',
    });
    setShowAddForm(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <motion.div
        className="flex items-center justify-between gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div>
          <h2 className="text-2xl font-bold text-bolt-elements-textPrimary">Prompts Personnalisés</h2>
          <p className="text-bolt-elements-textSecondary mt-1">
            Créez et gérez vos propres prompts pour personnaliser les interactions avec l'IA
          </p>
        </div>
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            <span className="i-ph:plus mr-2" />
            Nouveau Prompt
          </Button>
        )}
      </motion.div>

      {/* Formulaire d'ajout/édition */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bolt-elements-background-depth-2 rounded-lg p-4"
        >
          <h3 className="text-lg font-medium mb-4 text-bolt-elements-textPrimary">
            {editingPromptId ? 'Modifier le prompt' : 'Ajouter un nouveau prompt'}
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="prompt-title" className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
                Titre *
              </label>
              <input
                id="prompt-title"
                type="text"
                value={newPrompt.label}
                onChange={(e) => setNewPrompt({ ...newPrompt, label: e.target.value })}
                className="w-full p-2 rounded-lg bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor text-bolt-elements-textPrimary"
                placeholder="Titre du prompt"
              />
            </div>
            <div>
              <label htmlFor="prompt-description" className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
                Description
              </label>
              <input
                id="prompt-description"
                type="text"
                value={newPrompt.description}
                onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                className="w-full p-2 rounded-lg bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor text-bolt-elements-textPrimary"
                placeholder="Description du prompt"
              />
            </div>
            <div>
              <label htmlFor="prompt-content" className="block text-sm font-medium text-bolt-elements-textSecondary mb-1">
                Contenu *
              </label>
              <textarea
                id="prompt-content"
                value={newPrompt.content}
                onChange={(e) => setNewPrompt({ ...newPrompt, content: e.target.value })}
                className="w-full p-2 rounded-lg bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor text-bolt-elements-textPrimary min-h-[200px]"
                placeholder="Contenu du prompt"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Annuler
              </Button>
              <Button
                onClick={editingPromptId ? handleUpdatePrompt : handleAddPrompt}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                {editingPromptId ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Liste des prompts personnalisés */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {customPrompts.length > 0 ? (
          customPrompts.map((prompt, index) => (
            <motion.div
              key={prompt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={classNames(
                'h-full',
                promptId === prompt.id ? 'border-purple-500' : 'border-bolt-elements-borderColor',
                'hover:border-purple-500/50 transition-colors duration-200'
              )}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-bolt-elements-textPrimary">{prompt.label}</CardTitle>
                      <CardDescription className="text-bolt-elements-textSecondary">
                        {prompt.description}
                      </CardDescription>
                    </div>
                    {promptId === prompt.id && (
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-500 font-medium">
                        Actif
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-bolt-elements-textSecondary max-h-[100px] overflow-hidden relative">
                    <p className="line-clamp-3">{prompt.content}</p>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-bolt-elements-background-depth-1 to-transparent"></div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-xs text-bolt-elements-textTertiary">
                    Modifié le {new Date(prompt.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartEdit(prompt)}
                      className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
                    >
                      <span className="i-ph:pencil" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePrompt(prompt.id)}
                      className="text-red-500 hover:text-red-600 hover:border-red-500"
                    >
                      <span className="i-ph:trash" />
                    </Button>
                    {promptId !== prompt.id && (
                      <Button
                        size="sm"
                        onClick={() => handleSelectPrompt(prompt.id)}
                        className="bg-purple-500 hover:bg-purple-600 text-white"
                      >
                        Utiliser
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))
        ) : (
          !showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-2 p-8 text-center bg-bolt-elements-background-depth-2 rounded-lg"
            >
              <div className="i-ph:chat-text text-4xl mx-auto mb-4 text-bolt-elements-textTertiary" />
              <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">
                Aucun prompt personnalisé
              </h3>
              <p className="text-bolt-elements-textSecondary mb-4">
                Créez votre premier prompt personnalisé pour améliorer vos interactions avec l'IA
              </p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                <span className="i-ph:plus mr-2" />
                Créer un prompt
              </Button>
            </motion.div>
          )
        )}
      </div>

      {/* Section des prompts de la bibliothèque */}
      <motion.div
        layout
        className="mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-4 flex items-center gap-2">
          <span className="i-ph:book text-purple-500" />
          Bibliothèque de prompts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PromptLibrary.getList().map((prompt, index) => (
            <motion.div
              key={prompt.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card className={classNames(
                'h-full',
                promptId === prompt.id ? 'border-purple-500' : 'border-bolt-elements-borderColor',
                'hover:border-purple-500/50 transition-colors duration-200'
              )}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-bolt-elements-textPrimary">{prompt.label}</CardTitle>
                      <CardDescription className="text-bolt-elements-textSecondary">
                        {prompt.description}
                      </CardDescription>
                    </div>
                    {promptId === prompt.id && (
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-500 font-medium">
                        Actif
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardFooter>
                  <div className="flex justify-end w-full">
                    {promptId !== prompt.id && (
                      <Button
                        size="sm"
                        onClick={() => handleSelectPrompt(prompt.id)}
                        className="bg-purple-500 hover:bg-purple-600 text-white"
                      >
                        Utiliser
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
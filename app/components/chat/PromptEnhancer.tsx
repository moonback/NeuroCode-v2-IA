import React, { useState } from 'react';
import { IconButton } from '~/components/ui/IconButton';
import { classNames } from '~/utils/classNames';
import { toast } from 'react-toastify';

interface PromptEnhancerProps {
  onEnhancedPrompt: (enhancedPrompt: string) => void;
  disabled?: boolean;
  provider?: any;
  model?: string;
}

export const PromptEnhancer: React.FC<PromptEnhancerProps> = ({
  onEnhancedPrompt,
  disabled = false,
  provider,
  model
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [context, setContext] = useState('');
  const [complexity, setComplexity] = useState('intermediate');
  const [outputType, setOutputType] = useState('detailed');
  const [language, setLanguage] = useState('french');
  const [tone, setTone] = useState('professional');
  const [isEnhancing, setIsEnhancing] = useState(false);

  const enhancePrompt = async () => {
    if (!description.trim()) {
      toast.error('Veuillez entrer une description');
      return;
    }

    setIsEnhancing(true);
    
    try {
      const response = await fetch('/api/enhancer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim(),
          context: context.trim(),
          complexity,
          outputType,
          language,
          tone,
          provider: provider || { name: 'openai' },
          model: model || 'gpt-4',
          type: 'structured_prompt'
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du prompt');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let enhancedPrompt = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          enhancedPrompt += chunk;
        }
      }
      
      if (enhancedPrompt.trim()) {
        onEnhancedPrompt(enhancedPrompt.trim());
        handleReset();
        toast.success('Prompt professionnel généré avec succès !');
      } else {
        throw new Error('Aucun prompt généré');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la génération du prompt');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleReset = () => {
    setDescription('');
    setContext('');
    setComplexity('intermediate');
    setOutputType('detailed');
    setLanguage('french');
    setTone('professional');
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enhancePrompt();
    }
    if (e.key === 'Escape') {
      handleReset();
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <IconButton
        title="Générateur de prompt professionnel"
        disabled={disabled}
        className={classNames(
          "relative group transition-all duration-300 ease-out",
          "hover:bg-indigo-500/15 hover:shadow-lg hover:shadow-indigo-500/20",
          "hover:scale-105 active:scale-95",
          "border border-transparent hover:border-indigo-400/40",
          isOpen ? "bg-indigo-500/10 border-indigo-400/50 shadow-md shadow-indigo-500/15" : ""
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={classNames(
          "i-ph:magic-wand text-xl transition-all duration-300",
          "group-hover:text-indigo-400",
          isOpen ? "text-indigo-400" : "text-bolt-elements-textSecondary"
        )}></div>
        {/* Subtle glow effect */}
        <div className="absolute inset-0 rounded-lg bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-all duration-300"></div>
      </IconButton>
      
      {/* Modal Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={handleReset}
          />
          
          {/* Main Panel */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-[95vw] md:max-w-[800px] z-50">
            <div className="bg-bolt-elements-background-depth-1 border border-bolt-elements-borderColor/50 rounded-2xl shadow-2xl shadow-black/20 backdrop-blur-xl overflow-hidden">
              {/* Header */}
              <div className="relative bg-indigo-500/5 border-b border-bolt-elements-borderColor/30 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 border border-indigo-400/20 rounded-xl">
                      <div className="i-ph:sparkle text-indigo-400 text-lg"></div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">
                        Générateur de Prompt Pro
                      </h3>
                      <p className="text-sm text-bolt-elements-textSecondary">
                        Créez des prompts optimisés avec l'IA
                      </p>
                    </div>
                  </div>
                  <IconButton
                    size="sm"
                    onClick={handleReset}
                    className="hover:bg-red-500/15 hover:text-red-400 transition-all duration-200 border border-transparent hover:border-red-400/30"
                  >
                    <div className="i-ph:x text-lg"></div>
                  </IconButton>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                {/* Description Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="i-ph:chat-circle-text text-indigo-400 text-base"></div>
                    <label className="text-sm font-medium text-bolt-elements-textPrimary">
                      Décrivez votre objectif
                    </label>
                  </div>
                  <div className="relative">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ex: Créer une application React avec authentification utilisateur et gestion des rôles..."
                      className={classNames(
                        "w-full h-20 px-4 py-3 text-sm rounded-lg resize-none transition-all duration-200",
                        "bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor/50",
                        "focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/10",
                        "text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary",
                        "hover:border-bolt-elements-borderColor/70",
                        "focus:outline-none"
                      )}
                      disabled={isEnhancing}
                    />
                  </div>
                </div>
                
                {/* Context Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="i-ph:info text-indigo-400 text-base"></div>
                    <label className="text-sm font-medium text-bolt-elements-textPrimary">
                      Contexte supplémentaire
                      <span className="text-xs text-bolt-elements-textTertiary ml-1">(optionnel)</span>
                    </label>
                  </div>
                  <div className="relative">
                    <textarea
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="Ex: Application pour startup, TypeScript, PostgreSQL, déploiement sur AWS..."
                      className={classNames(
                        "w-full h-16 px-4 py-3 text-sm rounded-lg resize-none transition-all duration-200",
                        "bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor/50",
                        "focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/10",
                        "text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary",
                        "hover:border-bolt-elements-borderColor/70",
                        "focus:outline-none"
                      )}
                      disabled={isEnhancing}
                    />
                  </div>
                </div>
                
                {/* Configuration Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Complexity */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="i-ph:graduation-cap text-indigo-400 text-sm"></div>
                      <label className="text-sm font-medium text-bolt-elements-textPrimary">
                        Niveau
                      </label>
                    </div>
                    <select
                      value={complexity}
                      onChange={(e) => setComplexity(e.target.value)}
                      className={classNames(
                        "w-full px-3 py-2.5 text-sm rounded-lg transition-all duration-200",
                        "bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor/50",
                        "focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/10",
                        "hover:border-bolt-elements-borderColor/70",
                        "text-bolt-elements-textPrimary focus:outline-none"
                      )}
                      disabled={isEnhancing}
                    >
                      <option value="beginner">🟢 Débutant</option>
                      <option value="intermediate">🟡 Intermédiaire</option>
                      <option value="advanced">🟠 Avancé</option>
                      <option value="expert">🔴 Expert</option>
                    </select>
                  </div>
                  
                  {/* Output Type */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="i-ph:list-bullets text-indigo-400 text-sm"></div>
                      <label className="text-sm font-medium text-bolt-elements-textPrimary">
                        Format
                      </label>
                    </div>
                    <select
                      value={outputType}
                      onChange={(e) => setOutputType(e.target.value)}
                      className={classNames(
                        "w-full px-3 py-2.5 text-sm rounded-lg transition-all duration-200",
                        "bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor/50",
                        "focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/10",
                        "hover:border-bolt-elements-borderColor/70",
                        "text-bolt-elements-textPrimary focus:outline-none"
                      )}
                      disabled={isEnhancing}
                    >
                      <option value="concise">⚡ Concis</option>
                      <option value="detailed">📋 Détaillé</option>
                      <option value="step-by-step">🔢 Étape par étape</option>
                      <option value="comprehensive">📚 Complet</option>
                    </select>
                  </div>
                  
                  {/* Language */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="i-ph:globe text-indigo-400 text-sm"></div>
                      <label className="text-sm font-medium text-bolt-elements-textPrimary">
                        Langue
                      </label>
                    </div>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className={classNames(
                        "w-full px-3 py-2.5 text-sm rounded-lg transition-all duration-200",
                        "bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor/50",
                        "focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/10",
                        "hover:border-bolt-elements-borderColor/70",
                        "text-bolt-elements-textPrimary focus:outline-none"
                      )}
                      disabled={isEnhancing}
                    >
                      <option value="french">🇫🇷 Français</option>
                      <option value="english">🇺🇸 Anglais</option>
                      <option value="spanish">🇪🇸 Espagnol</option>
                      <option value="german">🇩🇪 Allemand</option>
                      <option value="italian">🇮🇹 Italien</option>
                    </select>
                  </div>
                  
                  {/* Tone */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="i-ph:chat-teardrop text-indigo-400 text-sm"></div>
                      <label className="text-sm font-medium text-bolt-elements-textPrimary">
                        Ton
                      </label>
                    </div>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className={classNames(
                        "w-full px-3 py-2.5 text-sm rounded-lg transition-all duration-200",
                        "bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor/50",
                        "focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-500/10",
                        "hover:border-bolt-elements-borderColor/70",
                        "text-bolt-elements-textPrimary focus:outline-none"
                      )}
                      disabled={isEnhancing}
                    >
                      <option value="professional">💼 Professionnel</option>
                      <option value="casual">😊 Décontracté</option>
                      <option value="technical">⚙️ Technique</option>
                      <option value="educational">🎓 Éducatif</option>
                      <option value="creative">🎨 Créatif</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-6 pt-4 border-t border-bolt-elements-borderColor/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-bolt-elements-textTertiary">
                    <div className="i-ph:keyboard text-sm"></div>
                    <span>Entrée pour générer • Échap pour fermer</span>
                  </div>
                  <button
                    onClick={enhancePrompt}
                    disabled={isEnhancing || !description.trim()}
                    className={classNames(
                      'px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200',
                      'bg-indigo-600 hover:bg-indigo-700 text-white',
                      'shadow-md hover:shadow-lg hover:shadow-indigo-500/20',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'hover:scale-[1.02] active:scale-[0.98]',
                      'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-bolt-elements-background-depth-1',
                      'border border-indigo-500/20'
                    )}
                  >
                    {isEnhancing ? (
                      <div className="flex items-center gap-2">
                        <div className="i-svg-spinners:90-ring-with-bg text-sm animate-spin"></div>
                        <span>Génération en cours...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="i-ph:magic-wand text-sm"></div>
                        <span>Générer le prompt</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      
    </div>
  );
};
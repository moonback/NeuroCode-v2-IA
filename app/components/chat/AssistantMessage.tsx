import { memo, Fragment, useState } from 'react';
import { Markdown } from './Markdown';
import type { JSONValue } from 'ai';
import Popover from '~/components/ui/Popover';
import { workbenchStore } from '~/lib/stores/workbench';
import { WORK_DIR } from '~/utils/constants';
import WithTooltip from '~/components/ui/Tooltip';
import type { Message } from 'ai';

import { Dropdown, DropdownItem } from '~/components/ui/Dropdown';
import { useSettings } from '~/lib/hooks/useSettings';
import { PromptLibrary } from '~/lib/common/prompt-library';
import { toast } from 'react-toastify';
import type { ProviderInfo } from '~/types/model';

interface AssistantMessageProps {
  content: string;
  annotations?: JSONValue[];
  messageId?: string;
  onRewind?: (messageId: string) => void;
  onFork?: (messageId: string) => void;
  onReply?: (messageId: string, content: string) => void;
  append?: (message: Message) => void;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  model?: string;
  provider?: ProviderInfo;
  isStreaming?: boolean;
}

function openArtifactInWorkbench(filePath: string) {
  filePath = normalizedFilePath(filePath);

  if (workbenchStore.currentView.get() !== 'code') {
    workbenchStore.currentView.set('code');
  }

  workbenchStore.setSelectedFile(`${WORK_DIR}/${filePath}`);
}

function normalizedFilePath(path: string) {
  let normalizedPath = path;

  if (normalizedPath.startsWith(WORK_DIR)) {
    normalizedPath = path.replace(WORK_DIR, '');
  }

  if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.slice(1);
  }

  return normalizedPath;
}

// Composant pour afficher l'indicateur de thinking en attente


// Composant pour afficher le raisonnement avec design moderne et amélioré
const ReasoningSection = ({ reasoning, reasoningMetadata }: { reasoning: string; reasoningMetadata: any }) => {
  const [isExpanded, setIsExpanded] = useState(true); // Ouvert par défaut pour une meilleure UX
  const [isAnimating, setIsAnimating] = useState(false);
  const [showReasoningToggle, setShowReasoningToggle] = useState(false); // Toggle pour masquer complètement

  const handleToggle = () => {
    setIsAnimating(true);
    setIsExpanded(!isExpanded);
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Analyser le contenu du raisonnement pour extraire les sections structurées
  const parseReasoningContent = (content: string) => {
    const sections: { title: string; content: string[]; icon?: string }[] = [];
    const lines = content.split('\n');
    let currentSection: { title: string; content: string[]; icon?: string } = { title: '', content: [], icon: '🧠' };
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.match(/^\*\*(Analyse?|Évaluation|Décision|Analysis|Evaluation|Decision)\*\*:?/i)) {
        if (currentSection.title) {
          sections.push(currentSection);
        }
        
        const titleText = trimmedLine.replace(/\*\*/g, '').replace(':', '');
        let icon = '💭';
        let cleanTitle = titleText;
        
        // Extraire l'icône si présente
        const iconMatch = titleText.match(/^([🔍💭✅🎯📋⚡🔧🌟]+)\s*(.*)/);
        if (iconMatch) {
          icon = iconMatch[1];
          cleanTitle = iconMatch[2] || titleText;
        }
        
        currentSection = { 
          title: cleanTitle, 
          content: [],
          icon
        };
      } else if (trimmedLine.startsWith('##') || trimmedLine.startsWith('#')) {
        // Support pour les titres markdown
        if (currentSection.title) {
          sections.push(currentSection);
        }
        
        const titleText = trimmedLine.replace(/^#+\s*/, '');
        currentSection = {
          title: titleText,
          content: [],
          icon: '📝'
        };
      } else if (trimmedLine) {
        currentSection.content.push(line);
      } else {
        // Préserver les lignes vides pour la mise en forme
        currentSection.content.push('');
      }
    }
    
    if (currentSection.title || currentSection.content.length > 0) {
      sections.push(currentSection);
    }
    
    return sections.length > 0 ? sections : [{ title: '', content: content.split('\n'), icon: '🧠' }];
  };

  const reasoningSections = parseReasoningContent(reasoning);
  const wordCount = reasoning.split(/\s+/).length;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200)); // ~200 mots par minute

  if (!showReasoningToggle) {
    return (
      <div className="mb-2">
        <button 
          onClick={() => setShowReasoningToggle(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md transition-colors duration-200"
        >
          <div className="i-ph:brain text-sm" />
          <span>Afficher le raisonnement</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200/70 dark:border-purple-700/70 rounded-lg shadow-sm backdrop-blur-sm transition-all duration-200 hover:shadow-md hover:border-purple-300/80 dark:hover:border-purple-600/80">
        
        {/* En-tête compact */}
        <div className="relative flex items-center justify-between px-4 py-3 cursor-pointer group" onClick={handleToggle}>
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center transition-transform duration-200 ${
          isAnimating ? 'scale-110' : 'group-hover:scale-105'
        }`}>
          <div className="i-ph:brain text-white text-sm" />
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-purple-700 dark:text-purple-200">🧠 Réflexion</span>
          
          {/* Badges compacts */}
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-xs font-medium">
              {estimatedReadTime}min
            </span>
            
            {reasoningMetadata?.confidence && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                reasoningMetadata.confidence === 'high' 
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                reasoningMetadata.confidence === 'medium' 
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                <div className={`w-1 h-1 rounded-full mr-1.5 ${
                  reasoningMetadata.confidence === 'high' ? 'bg-emerald-500' :
                  reasoningMetadata.confidence === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                {reasoningMetadata.confidence === 'high' ? 'Élevée' :
                 reasoningMetadata.confidence === 'medium' ? 'Moyenne' : 'Faible'}
              </span>
            )}
            
            {reasoningSections.length > 1 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-xs font-medium">
                {reasoningSections.length} sections
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Boutons de contrôle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
          {wordCount} mots
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowReasoningToggle(false);
          }}
          className="flex-shrink-0 w-6 h-6 rounded bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center transition-all duration-200"
          title="Masquer le raisonnement"
        >
          <div className="i-ph:x text-red-600 dark:text-red-400 text-xs" />
        </button>
        <button className={`flex-shrink-0 w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-all duration-200 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 ${
          isExpanded ? 'rotate-180' : ''
        }`}>
          <div className="i-ph:caret-down text-slate-500 dark:text-slate-400 text-xs" />
        </button>
      </div>
    </div>
    
    {/* Contenu expansible */}
    {isExpanded && (
      <div className="border-t border-purple-200/70 dark:border-purple-700/70 bg-white/60 dark:bg-slate-900/60">
        <div className="p-4">
          
          {/* Métadonnées d'extraction (compactes) */}
          {reasoningMetadata?.extractionMethod && (
            <div className="mb-3 pb-2 border-b border-slate-200/50 dark:border-slate-700/50">
              <span className="inline-flex items-center text-xs text-slate-600 dark:text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2" />
                Méthode : {reasoningMetadata.extractionMethod === 'explicit' ? 'Balises explicites' :
                          reasoningMetadata.extractionMethod === 'pattern' ? 'Structure détectée' :
                          reasoningMetadata.extractionMethod === 'heuristic' ? 'Analyse heuristique' :
                          reasoningMetadata.extractionMethod === 'fallback' ? 'Début du contenu' :
                          reasoningMetadata.extractionMethod}
                {reasoningMetadata?.originalLength && (
                  <span className="ml-3 text-slate-500">
                    • {Math.round((reasoning.length / reasoningMetadata.originalLength) * 100)}% extrait
                  </span>
                )}
              </span>
            </div>
          )}
          
          {/* Contenu du raisonnement */}
          {reasoningSections.length > 1 ? (
            <div className="space-y-3">
              {reasoningSections.map((section, index) => (
                <div key={index} className="group">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{section.icon}</span>
                    <h4 className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                      {section.title}
                    </h4>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                  </div>
                  <div className="ml-5 p-3 rounded bg-purple-50/50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-800/30">
                    <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {section.content.join('\n').trim()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded bg-purple-50/30 dark:bg-purple-500/5 border border-purple-100/50 dark:border-purple-800/20">
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {reasoning}
              </div>
            </div>
          )}
          
          {/* Footer avec avertissement si tronqué */}
          {reasoning.includes('[Raisonnement tronqué...]') && (
            <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <div className="i-ph:warning text-sm" />
                <span>Contenu partiellement affiché</span>
              </div>
            </div>
          )}
          
        </div>
      </div>
    )}
  </div>
</div>
  );
};

// Composant pour sélectionner un prompt avec design amélioré
const PromptSelector = () => {
  const { promptId, setPromptId } = useSettings();
  const prompts = PromptLibrary.getList();
  
  const currentPrompt = prompts.find(p => p.id === promptId) || prompts[0];
  
  return (
    <div className="mt-3 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
      <Dropdown
        trigger={
          <button className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 hover:from-slate-100 hover:to-gray-100 dark:hover:from-slate-800/60 dark:hover:to-gray-800/60 border border-slate-200/70 dark:border-slate-700/70 hover:border-slate-300/70 dark:hover:border-slate-600/70 rounded-lg transition-all duration-200 text-sm shadow-sm hover:shadow-md">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <span className="i-ph:book text-white text-xs" />
            </div>
            <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100 truncate max-w-[140px]">
              {currentPrompt.label}
            </span>
            <div className="i-ph:caret-down text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 text-xs ml-auto" />
          </button>
        }
      >
        <div className="py-1">
          {prompts.map((prompt) => (
            <DropdownItem
              key={prompt.id}
              className={`px-3 py-2 text-sm flex items-center gap-3 transition-colors duration-200 ${
                promptId === prompt.id 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
              }`}
              onSelect={() => {
                setPromptId(prompt.id);
                toast.success(`Prompt "${prompt.label}" selected`);
              }}
            >
              <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                {promptId === prompt.id ? (
                  <div className="i-ph:check-circle-fill text-purple-500" />
                ) : (
                  <div className="i-ph:circle text-slate-400" />
                )}
              </div>
              <span className="truncate">{prompt.label}</span>
            </DropdownItem>
          ))}
        </div>
      </Dropdown>
    </div>
  );
};

export const AssistantMessage = memo(
  ({
    content,
    annotations,
    messageId,
    onRewind,
    onFork,
    onReply,
    append,
    chatMode,
    setChatMode,
    model,
    provider,
    isStreaming = false,
  }: AssistantMessageProps) => {
    const filteredAnnotations = (annotations?.filter(
      (annotation: JSONValue) =>
        annotation && typeof annotation === 'object' && Object.keys(annotation).includes('type'),
    ) || []) as { type: string; value: any } & { [key: string]: any }[];

    let chatSummary: string | undefined = undefined;

    if (filteredAnnotations.find((annotation) => annotation.type === 'chatSummary')) {
      chatSummary = filteredAnnotations.find((annotation) => annotation.type === 'chatSummary')?.summary;
    }

    let codeContext: string[] | undefined = undefined;

    if (filteredAnnotations.find((annotation) => annotation.type === 'codeContext')) {
      codeContext = filteredAnnotations.find((annotation) => annotation.type === 'codeContext')?.files;
    }

    let reasoning: string | undefined = undefined;
    let reasoningMetadata: any = undefined;

    const reasoningAnnotation = filteredAnnotations.find((annotation) => annotation.type === 'reasoning');
    if (reasoningAnnotation) {
      reasoning = reasoningAnnotation.content;
      reasoningMetadata = reasoningAnnotation.metadata;
    }

    const usage: {
      completionTokens: number;
      promptTokens: number;
      totalTokens: number;
    } = filteredAnnotations.find((annotation) => annotation.type === 'usage')?.value;

    return (
      <div className="overflow-hidden w-full">
        {/* Header avec statistiques redesigné */}
        <div className="flex gap-3 items-center justify-between mb-4 p-3 bg-gradient-to-r from-gray-50/80 to-violet-50/80 dark:from-gray-800/50 dark:to-violet-900/20 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {usage && (
              <>
                {/* Badge principal des tokens */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 border border-violet-500/20 backdrop-blur-sm">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-600" />
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 animate-ping opacity-75" />
                  </div>
                  <span className="text-sm font-semibold text-violet-700 dark:text-violet-300 whitespace-nowrap">
                    {usage.totalTokens.toLocaleString()}
                  </span>
                  <span className="text-xs text-violet-600 dark:text-violet-400 hidden sm:inline">tokens</span>
                </div>
                
                {/* Détails des tokens avec design moderne */}
                <div className="hidden lg:flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200/50 dark:border-emerald-700/50">
                    <div className="i-ph:arrow-right text-emerald-600 dark:text-emerald-400 text-xs" />
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      {usage.promptTokens.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-violet-50 dark:bg-violet-900/30 border border-violet-200/50 dark:border-violet-700/50">
                    <div className="i-ph:arrow-left text-violet-600 dark:text-violet-400 text-xs" />
                    <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                      {usage.completionTokens.toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Actions redesignées */}
          {(onRewind || onFork || onReply) && messageId && (
            <div className="flex gap-1">
              {onReply && (
                <WithTooltip tooltip="Répondre à ce message">
                  <button
                    onClick={() => onReply(messageId, content)}
                    className="w-8 h-8 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-violet-50 dark:hover:bg-violet-900/30 border border-gray-200 dark:border-gray-600 hover:border-violet-300 dark:hover:border-violet-600 flex items-center justify-center transition-all duration-200 hover:scale-105"
                  >
                    <div className="i-ph:arrow-bend-up-left text-sm text-bolt-elements-textSecondary hover:text-violet-600 dark:hover:text-violet-400" />
                  </button>
                </WithTooltip>
              )}
              {onRewind && (
                <WithTooltip tooltip="Revert to this message">
                  <button
                    onClick={() => onRewind(messageId)}
                    className="w-8 h-8 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-amber-50 dark:hover:bg-amber-900/30 border border-gray-200 dark:border-gray-600 hover:border-amber-300 dark:hover:border-amber-600 flex items-center justify-center transition-all duration-200 hover:scale-105"
                  >
                    <div className="i-ph:arrow-u-up-left text-sm text-bolt-elements-textSecondary hover:text-amber-600 dark:hover:text-amber-400" />
                  </button>
                </WithTooltip>
              )}
              {onFork && (
                <WithTooltip tooltip="Fork chat from this message">
                  <button
                    onClick={() => onFork(messageId)}
                    className="w-8 h-8 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 flex items-center justify-center transition-all duration-200 hover:scale-105"
                  >
                    <div className="i-ph:git-fork text-sm text-bolt-elements-textSecondary hover:text-purple-600 dark:hover:text-purple-400" />
                  </button>
                </WithTooltip>
              )}
            </div>
          )}
        </div>

        {/* Section de raisonnement - Affichée AVANT le contenu principal */}
        {isStreaming && !reasoning && (
          <div className="mb-4">
            <div className="relative overflow-hidden bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border border-slate-200/70 dark:border-slate-700/70 rounded-lg shadow-sm backdrop-blur-sm">
              {/* Skeleton header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center animate-pulse">
                    <div className="i-ph:brain text-white text-sm" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-5 w-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  <div className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"></div>
                </div>
              </div>
              
              {/* Skeleton content preview */}
              <div className="px-4 pb-3">
                <div className="space-y-2">
                  <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  <div className="h-3 w-4/5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="i-ph:circle-notch animate-spin" />
                  <span>🧠 Extraction du processus de réflexion en cours...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {reasoning && (
          <ReasoningSection
            reasoning={reasoning}
            reasoningMetadata={reasoningMetadata}
          />
        )}

        {/* Contenu principal */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <Markdown append={append} chatMode={chatMode} setChatMode={setChatMode} model={model} provider={provider} html>
            {content}
          </Markdown>
        </div>

        {/* Sélecteur de prompt */}
        <PromptSelector />
      </div>
    );
  },
);
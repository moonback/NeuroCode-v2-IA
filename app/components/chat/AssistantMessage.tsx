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

// Composant pour afficher le raisonnement avec design moderne et amélioré
const ReasoningSection = ({ reasoning, reasoningMetadata }: { reasoning: string; reasoningMetadata: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

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

  return (
    <div className="mb-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-50/80 via-indigo-50/80 to-purple-50/80 dark:from-violet-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-violet-200/60 dark:border-violet-800/60 rounded-xl shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md">
        {/* Effet de brillance subtil */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative flex items-center justify-between p-5 cursor-pointer group" onClick={handleToggle}>
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm transition-transform duration-300 ${
              isAnimating ? 'scale-110' : 'group-hover:scale-105'
            }`}>
              <div className="i-ph:brain text-white text-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-violet-900 dark:text-violet-100">Raisonnement</span>
                <span className="text-xs px-2 py-0.5 bg-violet-100 dark:bg-violet-800/50 text-violet-600 dark:text-violet-300 rounded-full">
                  {estimatedReadTime} min
                </span>
              </div>
              <p className="text-xs text-violet-600 dark:text-violet-300 mt-0.5">
                {reasoningSections.length > 1 ? `${reasoningSections.length} sections • ` : ''}
                Processus de réflexion de l'IA
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Badges de métadonnées améliorés */}
            <div className="flex items-center gap-2">
              {reasoningMetadata?.extractionMethod && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-900/80 dark:to-indigo-900/80 text-violet-700 dark:text-violet-200 border border-violet-200/50 dark:border-violet-700/50 transition-all duration-200 hover:scale-105">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mr-2 animate-pulse" />
                  {reasoningMetadata.extractionMethod === 'explicit' ? 'Balises explicites' :
                   reasoningMetadata.extractionMethod === 'pattern' ? 'Structure détectée' :
                   reasoningMetadata.extractionMethod === 'heuristic' ? 'Analyse heuristique' :
                   reasoningMetadata.extractionMethod === 'fallback' ? 'Début du contenu' :
                   reasoningMetadata.extractionMethod}
                </span>
              )}
              {reasoningMetadata?.confidence && (
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105 ${
                  reasoningMetadata.confidence === 'high' 
                    ? 'bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/80 dark:to-green-900/80 text-emerald-700 dark:text-emerald-200 border-emerald-200/50 dark:border-emerald-700/50' :
                  reasoningMetadata.confidence === 'medium' 
                    ? 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/80 dark:to-yellow-900/80 text-amber-700 dark:text-amber-200 border-amber-200/50 dark:border-amber-700/50' :
                    'bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/80 dark:to-rose-900/80 text-red-700 dark:text-red-200 border-red-200/50 dark:border-red-700/50'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                    reasoningMetadata.confidence === 'high' ? 'bg-emerald-500 animate-pulse' :
                    reasoningMetadata.confidence === 'medium' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  {reasoningMetadata.confidence === 'high' ? 'Élevée' :
                   reasoningMetadata.confidence === 'medium' ? 'Moyenne' : 'Faible'}
                </span>
              )}
            </div>
            
            <WithTooltip tooltip={isExpanded ? "Masquer le raisonnement" : "Afficher le raisonnement"}>
              <button className={`flex-shrink-0 w-8 h-8 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-violet-200/50 dark:border-violet-700/50 flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${
                isExpanded ? 'rotate-180' : ''
              }`}>
                <div className="i-ph:caret-down text-violet-600 dark:text-violet-400 text-sm" />
              </button>
            </WithTooltip>
          </div>
        </div>
        
        {isExpanded && (
          <div className="px-5 pb-5 transition-all duration-300 ease-in-out">
            <div className="relative bg-white/60 dark:bg-gray-900/60 rounded-lg border border-violet-200/30 dark:border-violet-800/30 backdrop-blur-sm overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-400 to-indigo-600 rounded-l-lg" />
              
              {/* Contenu du raisonnement avec sections structurées */}
              <div className="p-4 pl-6">
                {reasoningSections.length > 1 ? (
                  <div className="space-y-4">
                    {reasoningSections.map((section, index) => (
                      <div key={index} className="group">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">{section.icon}</span>
                          <h4 className="font-semibold text-violet-900 dark:text-violet-100 text-sm uppercase tracking-wide">
                            {section.title}
                          </h4>
                          <div className="flex-1 h-px bg-gradient-to-r from-violet-200/50 dark:from-violet-800/50 to-transparent"></div>
                        </div>
                        <div className="ml-6 p-3 rounded-lg bg-white/40 dark:bg-gray-900/40 border border-violet-200/30 dark:border-violet-800/30">
                          <div className="text-sm text-violet-800 dark:text-violet-100 whitespace-pre-wrap leading-relaxed">
                            {section.content.join('\n').trim()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-white/40 dark:bg-gray-900/40 border border-violet-200/30 dark:border-violet-800/30">
                    <div className="text-sm text-violet-800 dark:text-violet-100 whitespace-pre-wrap leading-relaxed">
                      {reasoning}
                    </div>
                  </div>
                )}
                
                {/* Informations supplémentaires */}
                <div className="mt-4 pt-3 border-t border-violet-200/30 dark:border-violet-800/30 flex items-center justify-between text-xs text-violet-600 dark:text-violet-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <div className="i-ph:text-aa text-sm" />
                      {wordCount} mots
                    </span>
                    {reasoningMetadata?.originalLength && (
                      <span className="flex items-center gap-1">
                        <div className="i-ph:file-text text-sm" />
                        {Math.round((reasoning.length / reasoningMetadata.originalLength) * 100)}% extrait
                      </span>
                    )}
                  </div>
                  
                  {reasoning.includes('[Raisonnement tronqué...]') && (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <div className="i-ph:warning text-sm" />
                      <span className="italic">Contenu tronqué</span>
                    </div>
                  )}
                </div>
              </div>
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
    <div className="mt-3 pt-2 border-t border-violet-200/30 dark:border-violet-800/30">
    <Dropdown
      trigger={
        <button className="group flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-violet-50 to-violet-100 dark:from-violet-900/30 dark:to-violet-800/30 hover:from-violet-100 hover:to-violet-200/80 dark:hover:from-violet-800/40 dark:hover:to-violet-700/40 border border-violet-200/50 dark:border-violet-700/50 hover:border-violet-300/50 dark:hover:border-violet-600/50 rounded-lg transition-all duration-200 text-xs">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
            <span className="i-ph:book text-white text-xs" />
          </div>
          <span className="font-medium text-violet-800 dark:text-violet-200 group-hover:text-violet-900 dark:group-hover:text-violet-100 truncate max-w-[120px]">
            {currentPrompt.label}
          </span>
          <div className="i-ph:caret-down text-violet-600 dark:text-violet-400 group-hover:text-violet-700 dark:group-hover:text-violet-300 text-xs" />
        </button>
      }
    >
      <div className="py-1">
        {prompts.map((prompt) => (
          <DropdownItem
            key={prompt.id}
            className={`px-3 py-1.5 text-xs flex items-center gap-2 ${promptId === prompt.id ? 'bg-gradient-to-r from-violet-100/80 to-violet-50/80 dark:from-violet-800/40 dark:to-violet-900/40 text-violet-900 dark:text-violet-100' : 'hover:bg-violet-50/50 dark:hover:bg-violet-900/30 text-violet-700 dark:text-violet-300'}`}
            onSelect={() => {
              setPromptId(prompt.id);
              toast.success(`Prompt "${prompt.label}" sélectionné`);
            }}
          >
            <div className="w-3 h-3 rounded-full border border-violet-300/50 dark:border-violet-600/50 flex items-center justify-center">
              {promptId === prompt.id && (
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-violet-500 to-violet-600" />
              )}
            </div>
            <span className="font-medium truncate max-w-[150px]">{prompt.label}</span>
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

        {/* Section de raisonnement */}
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
import { memo, useState } from 'react';
import { Markdown } from './Markdown';
import type { JSONValue } from 'ai';
import { WORK_DIR } from '~/utils/constants';
import WithTooltip from '~/components/ui/Tooltip';
import type { Message } from 'ai';

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



// Composant pour afficher le raisonnement avec design cohérent
const ReasoningSection = ({ reasoning, reasoningMetadata }: { reasoning: string; reasoningMetadata: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReasoningToggle, setShowReasoningToggle] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
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

  // Affichage direct du composant de raisonnement

  return (
    <div className="mb-4">
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border border-slate-200/70 dark:border-slate-700/70 rounded-lg shadow-sm backdrop-blur-sm">
        
        {/* Header */}
        <div 
          className="group flex items-center justify-between px-4 py-3.5 cursor-pointer transition-all duration-200" 
          onClick={handleToggle}
        >
          <div className="flex items-center gap-4">
            {/* Icon container with animated background */}
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <div className="i-ph:brain text-white text-sm group-hover:scale-110 transition-transform" />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              {/* Title */}
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Réflexion
              </span>
          
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-xs font-medium">
                  <div className="i-ph:clock-clockwise mr-1.5 text-xs opacity-70" />
                  {estimatedReadTime} min
                </span>
                
                {reasoningMetadata?.confidence && (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                    reasoningMetadata.confidence === 'high' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                    reasoningMetadata.confidence === 'medium' 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' :
                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      reasoningMetadata.confidence === 'high' ? 'bg-green-500' :
                      reasoningMetadata.confidence === 'medium' ? 'bg-slate-500' : 'bg-red-500'
                    }`} />
                    {reasoningMetadata.confidence === 'high' ? 'Élevée' :
                     reasoningMetadata.confidence === 'medium' ? 'Moyenne' : 'Faible'}
                  </span>
                )}
                
                {reasoningSections.length > 1 && (
                  <span className="inline-flex items-center px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md text-xs font-medium">
                    <div className="i-ph:list-numbers mr-1.5 text-xs opacity-70" />
                    {reasoningSections.length} sections
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {wordCount} mots
            </span>
            
            <button 
              className={`flex-shrink-0 w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center transition-all duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
            >
              <div className="i-ph:caret-down text-slate-600 dark:text-slate-300 text-sm" />
            </button>
          </div>
        </div>
        
        {/* Expandable content */}
        {isExpanded && (
          <div className="border-t border-slate-200/70 dark:border-slate-700/70 bg-white/50 dark:bg-slate-800/50">
            <div className="p-4">
              
              {/* Extraction metadata */}
              {reasoningMetadata?.extractionMethod && (
                <div className="mb-3 pb-2 border-b border-slate-200/70 dark:border-slate-700/70">
                  <span className="inline-flex items-center text-xs text-slate-500 dark:text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2" />
                    Méthode : {reasoningMetadata.extractionMethod === 'explicit' ? 'Balises explicites' :
                              reasoningMetadata.extractionMethod === 'pattern' ? 'Structure détectée' :
                              reasoningMetadata.extractionMethod === 'heuristic' ? 'Analyse heuristique' :
                              reasoningMetadata.extractionMethod === 'fallback' ? 'Début du contenu' :
                              reasoningMetadata.extractionMethod}
                    {reasoningMetadata?.originalLength && (
                      <span className="ml-3 text-slate-400 dark:text-slate-500">
                        • {Math.round((reasoning.length / reasoningMetadata.originalLength) * 100)}% extrait
                      </span>
                    )}
                  </span>
                </div>
              )}
              
              {/* Reasoning content */}
              {reasoningSections.length > 1 ? (
                <div className="space-y-3">
                  {reasoningSections.map((section, index) => (
                    <div key={index}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{section.icon}</span>
                        <h4 className="font-medium text-slate-700 dark:text-slate-200 text-sm">
                          {section.title}
                        </h4>
                        <div className="flex-1 h-px bg-slate-200/70 dark:bg-slate-700/70"></div>
                      </div>
                      <div className="ml-5 p-3 rounded bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70">
                        <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {section.content.join('\n').trim()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded bg-white/80 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70">
                  <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {reasoning}
                  </div>
                </div>
              )}
              
              {/* Truncation warning */}
              {reasoning.includes('[Raisonnement tronqué...]') && (
                <div className="mt-3 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
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
        {/* Header avec statistiques cohérent */}
        <div className="flex gap-3 items-center justify-between mb-4 p-3 bg-bolt-elements-bg-depth-2 ">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {usage && (
              <>
                {/* Badge principal des tokens */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bolt-elements-button-primary-background border border-bolt-elements-borderColor">
                  <div className="relative">
                    <div className="w-2 h-2 rounded-full bg-bolt-elements-button-primary-text" />
                    <div className="absolute inset-0 w-2 h-2 rounded-full bg-bolt-elements-button-primary-text animate-ping opacity-75" />
                  </div>
                  <span className="text-sm font-semibold text-bolt-elements-button-primary-text whitespace-nowrap">
                    {usage.totalTokens.toLocaleString()}
                  </span>
                  <span className="text-xs text-bolt-elements-textSecondary hidden sm:inline">tokens</span>
                </div>
                
                {/* Détails des tokens */}
                <div className="hidden lg:flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-bolt-elements-bg-depth-3 border border-bolt-elements-borderColor">
                    <div className="i-ph:arrow-right text-bolt-elements-textSecondary text-xs" />
                    <span className="text-xs font-medium text-bolt-elements-textPrimary">
                      {usage.promptTokens.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-bolt-elements-bg-depth-3 border border-bolt-elements-borderColor">
                    <div className="i-ph:arrow-left text-bolt-elements-textSecondary text-xs" />
                    <span className="text-xs font-medium text-bolt-elements-textPrimary">
                      {usage.completionTokens.toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Actions cohérentes */}
          {(onRewind || onFork || onReply) && messageId && (
            <div className="flex gap-1">
              {onReply && (
                <WithTooltip tooltip="Répondre à ce message">
                  <button
                    onClick={() => onReply(messageId, content)}
                    className="w-8 h-8 bg-bolt-elements-background-depth-3 rounded-lg bg-bolt-elements-bg-depth-1 hover:bg-bolt-elements-item-backgroundActive border border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive flex items-center justify-center transition-all duration-200"
                  >
                    <div className="i-ph:arrow-bend-up-left text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary" />
                  </button>
                </WithTooltip>
              )}
              {onRewind && (
                <WithTooltip tooltip="Revert to this message">
                  <button
                    onClick={() => onRewind(messageId)}
                    className="w-8 h-8 rounded-lg bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-item-backgroundActive border border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive flex items-center justify-center transition-all duration-200"
                  >
                    <div className="i-ph:arrow-u-up-left text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary" />
                  </button>
                </WithTooltip>
              )}
              {onFork && (
                <WithTooltip tooltip="Fork chat from this message">
                  <button
                    onClick={() => onFork(messageId)}
                    className="w-8 h-8 rounded-lg bg-bolt-elements-background-depth-3 hover:bg-bolt-elements-item-backgroundActive border border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive flex items-center justify-center transition-all duration-200"
                  >
                    <div className="i-ph:git-fork text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary" />
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


      </div>
    );
  },
);
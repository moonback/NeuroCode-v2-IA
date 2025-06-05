import { memo, Fragment } from 'react';
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

// Composant pour sélectionner un prompt
const PromptSelector = () => {
  const { promptId, setPromptId } = useSettings();
  const prompts = PromptLibrary.getList();
  
  const currentPrompt = prompts.find(p => p.id === promptId) || prompts[0];
  
  return (
    <Dropdown
      trigger={
        <button className="flex bg-transparent items-center gap-1 text-sm text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors">
          <span className="i-ph:book text-lg" />
          <span className="hidden md:inline">{currentPrompt.label}</span>
          <span className="i-ph:caret-down text-xs" />
        </button>
      }
    >
      {prompts.map((prompt) => (
        <DropdownItem
          key={prompt.id}
          className={promptId === prompt.id ? 'bg-bolt-elements-background-depth-3' : ''}
          onSelect={() => {
            setPromptId(prompt.id);
            toast.success(`Prompt "${prompt.label}" sélectionné`);
          }}
        >
          <div className="flex flex-col">
            <span>{prompt.label}</span>
            <span className="text-xs text-bolt-elements-textTertiary">{prompt.description}</span>
          </div>
        </DropdownItem>
      ))}
    </Dropdown>
  );
};

export const AssistantMessage = memo(
  ({
    content,
    annotations,
    messageId,
    onRewind,
    onFork,
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

    const usage: {
      completionTokens: number;
      promptTokens: number;
      totalTokens: number;
    } = filteredAnnotations.find((annotation) => annotation.type === 'usage')?.value;

    return (
      <div className="overflow-hidden w-full">
        <>
          <div className=" flex gap-2 items-center text-sm text-bolt-elements-textSecondary mb-2">
            
            
            <div className="flex w-full items-center justify-between">
              {usage && (
                <div className="flex items-center min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse" />
                    <span className="text-xs text-bolt-elements-textSecondary font-medium whitespace-nowrap">
                      {usage.totalTokens.toLocaleString()} tokens
                    </span>
                  </div>
                
                {/* Détails des tokens avec style moderne */}
                <div className="hidden sm:flex items-center gap-2 text-xs text-bolt-elements-textTertiary">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-bolt-elements-background-depth-2/50 border border-bolt-elements-borderColor/20">
                    <div className="i-ph:arrow-right text-emerald-500 text-xs" />
                    <span>{usage.promptTokens.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-bolt-elements-background-depth-2/50 border border-bolt-elements-borderColor/20">
                    <div className="i-ph:arrow-left text-blue-500 text-xs" />
                    <span>{usage.completionTokens.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              )}
              {(onRewind || onFork) && messageId && (
                <div className="flex gap-2 flex-col lg:flex-row ml-auto">
                  {onRewind && (
                    <WithTooltip tooltip="Revert to this message">
                      <button
                        onClick={() => onRewind(messageId)}
                        key="i-ph:arrow-u-up-left"
                        className="i-ph:arrow-u-up-left text-xl text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                      />
                    </WithTooltip>
                  )}
                  {onFork && (
                    <WithTooltip tooltip="Fork chat from this message">
                      <button
                        onClick={() => onFork(messageId)}
                        key="i-ph:git-fork"
                        className="i-ph:git-fork text-xl text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                      />
                    </WithTooltip>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
        <Markdown append={append} chatMode={chatMode} setChatMode={setChatMode} model={model} provider={provider} html>
          {content}
        </Markdown>
        <PromptSelector />

      </div>
    );
  },
);

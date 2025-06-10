import * as React from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { classNames } from '~/utils/classNames';
import { PROVIDER_LIST } from '~/utils/constants';
import { ModelSelector } from '~/components/chat/ModelSelector';
import { APIKeyManager } from './APIKeyManager';
import { LOCAL_PROVIDERS } from '~/lib/stores/settings';
import FilePreview from './FilePreview';
import { ScreenshotStateManager } from './ScreenshotStateManager';
import { SendButton } from './SendButton.client';
import { IconButton } from '~/components/ui/IconButton';
import { toast } from 'react-toastify';
import { SpeechRecognitionButton } from '~/components/chat/SpeechRecognition';
import { ImportButtons } from '~/components/chat/chatExportAndImport/ImportButtons';
import GitCloneButton from './GitCloneButton';
import { ColorSchemeDialog } from '~/components/ui/ColorSchemeDialog';
import { ProjectStructureDialog } from '~/components/ui/ProjectStructureDialog';
import type { DesignScheme } from '~/types/design-scheme';
import type { ProjectStructure } from '~/types/project-structure';
import type { ElementInfo } from '~/components/workbench/Inspector';

import { ExpoQrModal } from '~/components/workbench/ExpoQrModal';
import { UIImageAnalyzer } from './UIImageAnalyzer';
import { PromptEnhancer } from './PromptEnhancer';
import { motion } from 'framer-motion';
import styles from './BaseChat.module.scss';
import type { ProviderInfo } from '~/types/model';
import type { Message } from 'ai';
import { workbenchStore } from '~/lib/stores/workbench';
import { useStore } from '@nanostores/react';

interface ChatBoxProps {
  isModelSettingsCollapsed: boolean;
  setIsModelSettingsCollapsed: (collapsed: boolean) => void;
  provider: any;
  providerList: any[];
  modelList: any[];
  apiKeys: Record<string, string>;
  isModelLoading: string | undefined;
  onApiKeysChange: (providerName: string, apiKey: string) => void;
  uploadedFiles: File[];
  imageDataList: string[];
  textareaRef: React.RefObject<HTMLTextAreaElement> | undefined;
  input: string;
  handlePaste: (e: React.ClipboardEvent) => void;
  TEXTAREA_MIN_HEIGHT: number;
  TEXTAREA_MAX_HEIGHT: number;
  isStreaming: boolean;
  handleSendMessage: (event: React.UIEvent, messageInput?: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  chatStarted: boolean;
  exportChat?: () => void;
  qrModalOpen: boolean;
  setQrModalOpen: (open: boolean) => void;
  handleFileUpload: () => void;
  setProvider?: ((provider: ProviderInfo) => void) | undefined;
  model?: string | undefined;
  setModel?: ((model: string) => void) | undefined;
  setUploadedFiles?: ((files: File[]) => void) | undefined;
  setImageDataList?: ((dataList: string[]) => void) | undefined;
  handleInputChange?: ((event: React.ChangeEvent<HTMLTextAreaElement>) => void) | undefined;
  handleStop?: (() => void) | undefined;
  enhancingPrompt?: boolean | undefined;
  enhancePrompt?: (() => void) | undefined;
  chatMode?: 'discuss' | 'build';
  setChatMode?: (mode: 'discuss' | 'build') => void;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
  append?: (message: Message) => void;
  designScheme?: DesignScheme;
  setDesignScheme?: (scheme: DesignScheme) => void;
  projectStructure?: ProjectStructure;
  setProjectStructure?: (structure: ProjectStructure) => void;
  selectedElement?: ElementInfo | null;
  setSelectedElement?: ((element: ElementInfo | null) => void) | undefined;
  runAnimation?: () => void;
  replyToMessage?: {id: string, content: string} | null;
  setReplyToMessage?: (reply: {id: string, content: string} | null) => void;
  onGenerateProjectPlan?: () => void;
}

export const ChatBox: React.FC<ChatBoxProps> = (props) => {
  const aiTargetFiles = useStore(workbenchStore.aiTargetFiles);
  const aiContext = useStore(workbenchStore.aiContext);
  const files = useStore(workbenchStore.files);
  const [isProjectPlanEnabled, setIsProjectPlanEnabled] = React.useState(false);

  const handleEnhancedPrompt = (enhancedPrompt: string) => {
    if (props.textareaRef?.current) {
      props.textareaRef.current.value = enhancedPrompt;
      props.textareaRef.current.style.height = 'auto';
      props.textareaRef.current.style.height = `${Math.min(props.textareaRef.current.scrollHeight, props.TEXTAREA_MAX_HEIGHT)}px`;
      
      // Déclencher l'événement onChange pour mettre à jour l'état
      const event = new Event('input', { bubbles: true });
      props.textareaRef.current.dispatchEvent(event);
      
      // Focus sur le textarea
      props.textareaRef.current.focus();
    }
  };

  return (
    <div
      className={classNames(
'relative bg-bolt-elements-background-depth-2 backdrop-blur p-3 rounded-lg border border-bolt-elements-borderColor relative w-full max-w-chat mx-auto z-prompt',
        /*
         * {
         *   'sticky bottom-2': chatStarted,
         * },
         */
      )}
    >
      {/* Bouton flottant de changement de mode */}

      <svg className={classNames(styles.PromptEffectContainer)}>
        <defs>
          <linearGradient
            id="line-gradient"
            x1="20%"
            y1="0%"
            x2="-14%"
            y2="10%"
            gradientUnits="userSpaceOnUse"
            gradientTransform="rotate(-45)"
          >
            <stop offset="0%" stopColor="#b44aff" stopOpacity="0%"></stop>
            <stop offset="40%" stopColor="#b44aff" stopOpacity="80%"></stop>
            <stop offset="50%" stopColor="#b44aff" stopOpacity="80%"></stop>
            <stop offset="100%" stopColor="#b44aff" stopOpacity="0%"></stop>
          </linearGradient>
          <linearGradient id="shine-gradient">
            <stop offset="0%" stopColor="white" stopOpacity="0%"></stop>
            <stop offset="40%" stopColor="#ffffff" stopOpacity="80%"></stop>
            <stop offset="50%" stopColor="#ffffff" stopOpacity="80%"></stop>
            <stop offset="100%" stopColor="white" stopOpacity="0%"></stop>
          </linearGradient>
        </defs>
        <rect className={classNames(styles.PromptEffectLine)} pathLength="100" strokeLinecap="round"></rect>
        <rect className={classNames(styles.PromptShine)} x="48" y="24" width="70" height="1"></rect>
      </svg>
      <div>
        {props.replyToMessage && (
        <div className="flex mx-1.5 gap-2 items-center justify-between rounded-lg rounded-b-none border border-b-none border-bolt-elements-borderColor text-bolt-elements-textPrimary flex py-1 px-2.5 font-medium text-xs bg-blue-50 dark:bg-blue-900/20">
          <div className="flex gap-2 items-center">
            <div className="i-ph:arrow-bend-up-left text-blue-500 w-4 h-4"></div>
            <span className="text-blue-600 dark:text-blue-400">Réponse à:</span>
            <span className="text-bolt-elements-textSecondary truncate max-w-[200px]">
              {props.replyToMessage.content.substring(0, 50)}{props.replyToMessage.content.length > 50 ? '...' : ''}
            </span>
          </div>
          <button
            className="bg-transparent text-blue-500 hover:text-blue-700 pointer-auto ml-[-20px]"
            onClick={() => props.setReplyToMessage?.(null)}
          >
            ✕
          </button>
        </div>
      )}
        {props.selectedElement && (
        <div className="flex mx-1.5 gap-2 items-center justify-between rounded-lg rounded-b-none border border-b-none border-bolt-elements-borderColor text-bolt-elements-textPrimary flex py-1 px-2.5 font-medium text-xs">
          <div className="flex gap-2 items-center lowercase">
            <code className="bg-accent-500 rounded-4px px-1.5 py-1 mr-0.5 text-white">
              {props?.selectedElement?.tagName}
            </code>
            sélectionné pour inspection
          </div>
          <button
            className="bg-transparent text-accent-500 pointer-auto ml-[-20px]"
            onClick={() => props.setSelectedElement?.(null)}
          >
            Effacer
          </button>
        </div>
      )}
        {aiTargetFiles.size > 0 && (
        <div className="flex mx-1.5 gap-2 items-center justify-between rounded-lg rounded-b-none border border-b-none border-bolt-elements-borderColor text-bolt-elements-textPrimary flex py-1 px-2.5 font-medium text-xs">
          <div className="flex gap-2 items-center lowercase">
            <code className="bg-violet-500 rounded-4px px-1.5 py-1 mr-0.5 text-white">
              {aiTargetFiles.size}
            </code>
            fichier(s) ciblé(s) pour l'IA
          </div>
          <button
            className="bg-transparent text-accent-500 pointer-auto ml-[-20px]"
            onClick={() => workbenchStore.clearAITargetFiles()}
          >
            Effacer
          </button>
        </div>
      )}
        <ClientOnly>
          {() => (
            <div className={props.isModelSettingsCollapsed ? 'hidden' : ''}>
              <ModelSelector
                key={props.provider?.name + ':' + props.modelList.length}
                model={props.model}
                setModel={props.setModel}
                modelList={props.modelList}
                provider={props.provider}
                setProvider={props.setProvider}
                providerList={props.providerList || (PROVIDER_LIST as ProviderInfo[])}
                apiKeys={props.apiKeys}
                modelLoading={props.isModelLoading}
              />
              {(props.providerList || []).length > 0 &&
                props.provider &&
                (!LOCAL_PROVIDERS.includes(props.provider.name) || 'OpenAILike') && (
                  <APIKeyManager
                    provider={props.provider}
                    apiKey={props.apiKeys[props.provider.name] || ''}
                    setApiKey={(key: string) => {
                      props.onApiKeysChange(props.provider.name, key);
                    }}
                  />
                )}
            </div>
          )}
        </ClientOnly>
      </div>
      <FilePreview
        files={props.uploadedFiles}
        imageDataList={props.imageDataList}
        onRemove={(fileToRemove: File) => {
          const newUploadedFiles = props.uploadedFiles.filter(f => f !== fileToRemove);
          props.setUploadedFiles?.(newUploadedFiles);

          if (fileToRemove.type.startsWith('image/')) {
            // Attempt to find the corresponding image data URL to remove.
            // This is complex because imageDataList is just an array of strings.
            // We need to determine which index in imageDataList corresponded to fileToRemove.
            let imageIndexToRemove = -1;
            let currentImageIdx = 0;
            for (let i = 0; i < props.uploadedFiles.length; i++) {
              const currentFile = props.uploadedFiles[i];
              if (currentFile.type.startsWith('image/')) {
                if (currentFile === fileToRemove) {
                  imageIndexToRemove = currentImageIdx;
                  break;
                }
                currentImageIdx++;
              }
            }

            if (imageIndexToRemove !== -1 && props.imageDataList) {
              const newImageDataList = props.imageDataList.filter((_, idx) => idx !== imageIndexToRemove);
              props.setImageDataList?.(newImageDataList);
            }
          }}}
      />
      <ClientOnly>
        {() => (
          <ScreenshotStateManager
            setUploadedFiles={props.setUploadedFiles}
            setImageDataList={props.setImageDataList}
            uploadedFiles={props.uploadedFiles}
            imageDataList={props.imageDataList}
          />
        )}
      </ClientOnly>
      <div
        className={classNames('relative shadow-xs border border-bolt-elements-borderColor backdrop-blur rounded-lg')}
      >
        <textarea
          ref={props.textareaRef}
          className={classNames(
            'w-full pl-4 pt-4 pr-16 outline-none resize-none text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary bg-transparent text-sm',
            'transition-all duration-200',
            'hover:border-bolt-elements-focus',
          )}
          onDragEnter={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '2px solid #1488fc';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '2px solid #1488fc';
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.currentTarget.style.border = '1px solid var(--bolt-elements-borderColor)';

            const files = Array.from(e.dataTransfer.files);
            const currentUploadedFiles = props.uploadedFiles || [];
            const currentImageDataList = props.imageDataList || [];
            
            // Add all files to uploadedFiles immediately
            const newUploadedFiles = [...currentUploadedFiles, ...files];
            props.setUploadedFiles?.(newUploadedFiles);

            // Process images asynchronously
            const imageFiles = files.filter(file => file.type.startsWith('image/'));
            if (imageFiles.length > 0) {
              const newImageDataPromises = imageFiles.map(file => {
                return new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = (readEvent) => {
                    resolve(readEvent.target?.result as string);
                  };
                  reader.readAsDataURL(file);
                });
              });

              try {
                const newImageData = await Promise.all(newImageDataPromises);
                props.setImageDataList?.([...currentImageDataList, ...newImageData]);
              } catch (error) {
                console.error('Error processing dropped images:', error);
              }
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              if (event.shiftKey) {
                return;
              }

              event.preventDefault();

              if (props.isStreaming) {
                props.handleStop?.();
                return;
              }

              // ignore if using input method engine
              if (event.nativeEvent.isComposing) {
                return;
              }

              // If there are targeted files, include them in the message
              if (aiTargetFiles.size > 0) {
                const targetedFiles = Array.from(aiTargetFiles);
                let message = '';
                
                if (props.input.trim()) {
                  message += `${props.input.trim()}\n\n`;
                }
                
                if (aiContext.trim()) {
                  message += `Context: ${aiContext}\n\n`;
                }
                
                message += `Please help me with the following ${targetedFiles.length} file(s):\n\n`;
                
                targetedFiles.forEach((filePath, index) => {
                  const fileName = filePath.split('/').pop() || 'file';
                  message += `**File ${index + 1}: ${fileName}**\n\n`;
                });
                
                props.handleSendMessage?.(event, message);
                
                // Clean up targets and context after sending
                setTimeout(() => {
                  workbenchStore.clearAITargetFiles();
                  workbenchStore.setAIContext('');
                }, 500);
                return;
              }

              props.handleSendMessage?.(event);
            }
          }}
          value={props.input}
          onChange={(event) => {
            props.handleInputChange?.(event);
          }}
          onPaste={props.handlePaste}
          style={{
            minHeight: props.TEXTAREA_MIN_HEIGHT,
            maxHeight: props.TEXTAREA_MAX_HEIGHT,
          }}
          placeholder={props.chatMode === 'build' 
            ? "Créons quelque chose d'incroyable ensemble ! Comment NeuroCode peut-il vous aider aujourd'hui ?" 
            : "De quoi souhaitez-vous discuter ? Je suis là pour vous aider !"
          }
          translate="no"
        />
        <ClientOnly>
          {() => {
            // Si des fichiers sont ciblés, afficher le bouton "Send to AI"
            if (aiTargetFiles.size > 0) {
              return (
                <motion.button
                  title={`Envoyer ${aiTargetFiles.size} fichier(s) ciblé(s) à l'IA`}
                  className="absolute flex justify-center items-center top-[35px] right-[22px] bg-violet-500 hover:bg-violet-600 color-white rounded-md w-[34px] h-[34px] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ ease: [0.4, 0, 0.2, 1], duration: 0.17 }}
                  onClick={(event) => {
                    event.preventDefault();
                    const targetedFiles = Array.from(aiTargetFiles);
                    let message = '';
                    
                    // Ajouter le contenu du textarea s'il y en a un
                    if (props.input.trim()) {
                      message += `${props.input.trim()}\n\n`;
                    }
                    
                    if (aiContext.trim()) {
                      message += `Context: ${aiContext}\n\n`;
                    }
                    
                    message += `Please help me with the following ${targetedFiles.length} file(s):\n\n`;
                    
                    // Skip file content and only include file names
                    targetedFiles.forEach((filePath, index) => {
                      const fileName = filePath.split('/').pop() || 'file';
                      message += `**File ${index + 1}: ${fileName}**\n\n`;
                    });
                    
                    props.handleSendMessage?.({} as React.UIEvent, message);
                    toast.success(`${targetedFiles.length} fichier(s) envoyé(s) au chat pour assistance IA`);
                    
                    // Vider le textarea après l'envoi
                    if (props.textareaRef?.current) {
                      props.textareaRef.current.value = '';
                      props.textareaRef.current.style.height = `${props.TEXTAREA_MIN_HEIGHT}px`;
                    }
                    
                    // Nettoyer automatiquement les targets et le contexte après l'envoi
                    setTimeout(() => {
                      workbenchStore.clearAITargetFiles();
                      workbenchStore.setAIContext('');
                      toast.info('Fichiers ciblés et contexte effacés automatiquement');
                    }, 500);
                  }}
                >
                  <div className="flex items-center justify-center">
                    <div className="i-ph:robot-duotone text-lg"></div>
                    <span className="absolute -top-1 -right-1 bg-white text-violet-500 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {String(aiTargetFiles.size)}
                    </span>
                  </div>
                </motion.button>
              );
            }
            
            // Sinon, afficher le bouton d'envoi normal
            return (
              <SendButton
                show={props.input.length > 0 || props.isStreaming || props.uploadedFiles.length > 0}
                isStreaming={props.isStreaming}
                disabled={!props.providerList || props.providerList.length === 0}
                onClick={(event) => {
                  if (props.isStreaming) {
                    props.handleStop?.();
                    return;
                  }

                  if (props.input.length > 0 || props.uploadedFiles.length > 0) {
                    props.handleSendMessage?.(event);
                  }
                }}
              />
            );
          }}
        </ClientOnly>
        <div className="flex justify-between items-center text-sm p-4 pt-2">
          <div className="flex gap-3 items-center">
            {/* Groupe 1: Actions de fichiers */}
            <div className="flex gap-1 items-center">
              {/* Bouton de changement de mode Chat/Build */}
              {props.chatStarted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }}
                  className="relative"
                >
                  <IconButton
                    title={`Passer en mode ${props.chatMode === 'discuss' ? 'Build' : 'Discussion'}`}
                    className={classNames(
                      'group relative flex items-center gap-2 px-1 py-1 rounded-lg',
                      'transition-all duration-300 ease-out',
                      'hover:scale-105',
                      'backdrop-blur-sm border',
                      'active:scale-95',
                      props.chatMode === 'discuss' 
                        ? [
                            'bg-gradient-to-br from-violet-500/10 to-violet-600/5',
                            'border-violet-400/30',
                            'text-violet-400',
                            'hover:bg-violet-500/15',
                            'hover:border-violet-400/50',
                            'hover:text-violet-300',
                            'shadow-sm shadow-violet-500/10'
                          ]
                        : [
                            'bg-gradient-to-br from-violet-500/10 to-violet-600/5',
                            'border-violet-400/30',
                            'text-violet-400',
                            'hover:bg-violet-500/15',
                            'hover:border-violet-400/50', 
                            'hover:text-violet-300',
                            'shadow-sm shadow-violet-500/10'
                          ]
                    )}
                    onClick={() => {
                      props.setChatMode?.(props.chatMode === 'discuss' ? 'build' : 'discuss');
                     
                    }}
                  >
                    <div className={classNames(
                      `i-ph:${props.chatMode === 'discuss' ? 'code' : 'chats'} text-lg`,
                      'transition-transform duration-300',
                      'group-hover:scale-110 group-hover:rotate-6'
                    )} />
                    <span className="text-xs font-medium tracking-wide">
                      {props.chatMode === 'discuss' ? 'Build' : 'Discussion'}
                    </span>
                  </IconButton>
                </motion.div>
              )}
{!props.chatStarted && (
            <ColorSchemeDialog designScheme={props.designScheme} setDesignScheme={props.setDesignScheme} />
          )}
              {!props.chatStarted && (
                <ProjectStructureDialog 
                  projectStructure={props.projectStructure} 
                  setProjectStructure={props.setProjectStructure} 
                />
              )}
              <IconButton 
                title="Télécharger un fichier" 
                className="transition-all hover:bg-bolt-elements-item-backgroundAccent/50" 
                onClick={() => props.handleFileUpload()}
              >
                <div className="i-ph:paperclip text-xl"></div>
              </IconButton>
              {!props.chatStarted && (
                <UIImageAnalyzer
                  sendMessage={props.handleSendMessage}
                  append={props.append}
                  model={props.model}
                  provider={props.provider}
                  onChatStart={props.runAnimation}
                />
              )}
              <IconButton
                title="Améliorer le prompt avec l'IA"
                disabled={props.input.length === 0 || props.enhancingPrompt}
                className={classNames(
                  'group relative transition-all duration-300 transform-gpu',
                  'hover:scale-110 hover:shadow-lg hover:shadow-purple-500/20',
                  'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
                  'border border-purple-500/20 hover:border-purple-400/40',
                  'backdrop-blur-sm rounded-lg',
                  'hover:from-purple-500/20 hover:to-pink-500/20',
                  'active:scale-95',
                  props.enhancingPrompt ? 'animate-pulse' : 'hover:animate-none'
                )}
                onClick={() => {
                  props.enhancePrompt?.();
                  toast.success('✨ Prompt amélioré avec succès !', {
                    position: "bottom-right",
                    autoClose: 2000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true
                  });
                }}
              >
                {props.enhancingPrompt ? (
                  <div className="i-svg-spinners:90-ring-with-bg text-purple-400 text-xl animate-spin"></div>
                ) : (
                  <div className="i-bolt:stars text-purple-400 group-hover:text-purple-300 text-xl transition-all duration-300 group-hover:scale-125 group-hover:rotate-12 drop-shadow-sm"></div>
                )}
                {/* Effet de brillance */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-pulse"></div>
              </IconButton>
              
              
              
              {!props.chatStarted && (
                <PromptEnhancer
                  onEnhancedPrompt={handleEnhancedPrompt}
                  disabled={props.isStreaming}
                  provider={props.provider}
                  model={props.model}
                />
              )}
              
              {/* Bouton de génération de plan de projet */}
              {!props.chatStarted && props.chatMode === 'build' && (
                <IconButton
                  title={isProjectPlanEnabled ? "Désactiver la génération automatique du plan de projet" : "Activer la génération automatique du plan de projet"}
                  className={classNames(
                    'group relative transition-all duration-300 transform-gpu',
                    'hover:scale-110 hover:shadow-lg',
                    'backdrop-blur-sm rounded-lg',
                    'active:scale-95',
                    isProjectPlanEnabled ? [
                      'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
                      'border border-green-500/40 hover:border-green-400/60',
                      'hover:from-green-500/30 hover:to-emerald-500/30',
                      'hover:shadow-green-500/20'
                    ] : [
                      'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
                      'border border-blue-500/20 hover:border-blue-400/40',
                      'hover:from-blue-500/20 hover:to-cyan-500/20',
                      'hover:shadow-blue-500/20'
                    ]
                  )}
                  onClick={() => {
                    const newState = !isProjectPlanEnabled;
                    setIsProjectPlanEnabled(newState);
                    
                    if (newState) {
                      props.onGenerateProjectPlan?.();
                      toast.success('✅ Plan de projet activé ! Il sera généré automatiquement avec votre prochaine demande.', {
                        position: "bottom-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true
                      });
                    } else {
                      toast.info('❌ Plan de projet désactivé.', {
                        position: "bottom-right",
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true
                      });
                    }
                  }}
                >
                  <div className={classNames(
                    'text-xl transition-all duration-300 group-hover:scale-125 drop-shadow-sm',
                    isProjectPlanEnabled 
                      ? 'i-ph:check-circle-duotone text-green-400 group-hover:text-green-300'
                      : 'i-ph:file-text-duotone text-blue-400 group-hover:text-blue-300'
                  )}></div>
                  
                  
                  
                  {/* Effet de brillance */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-pulse"></div>
                </IconButton>
              )}

            </div>

            {/* Séparateur visuel */}
            <div className="w-px h-6 bg-bolt-elements-borderColor"></div>

            {/* Groupe 2: Communication et Import */}
            <div className="flex gap-1 items-center">
              <SpeechRecognitionButton
                isListening={props.isListening}
                onStart={props.startListening}
                onStop={props.stopListening}
                disabled={props.isStreaming}
              />
              
              {/* Boutons Import groupés avec un style cohérent */}
              <div className="flex gap-1 items-center">
                {ImportButtons(props.importChat)}
                <GitCloneButton 
                  importChat={props.importChat} 
                  iconOnly={true}
                />
              </div>
            </div>

            

            {/* Séparateur visuel */}
            <div className="w-px h-6 bg-bolt-elements-borderColor"></div>

            {/* Groupe 4: Paramètres */}
            <IconButton
              title="Paramètres du modèle"
              className={classNames('transition-all flex items-center gap-1 hover:bg-bolt-elements-item-backgroundAccent/50', {
                'bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent':
                  props.isModelSettingsCollapsed,
                'bg-bolt-elements-item-backgroundDefault text-bolt-elements-item-contentDefault':
                  !props.isModelSettingsCollapsed,
              })}
              onClick={() => props.setIsModelSettingsCollapsed(!props.isModelSettingsCollapsed)}
              disabled={!props.providerList || props.providerList.length === 0}
            >
              <div className={`i-ph:caret-${props.isModelSettingsCollapsed ? 'right' : 'down'} text-lg`} />
              {props.isModelSettingsCollapsed ? <span className="text-xs font-medium truncate max-w-[100px]">{props.provider.name}</span> : <span />}
            </IconButton>
          </div>
          {/* {props.input.length > 3 ? (
            <div className="text-xs text-bolt-elements-textTertiary">
              Utilisez <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Shift</kbd> +{' '}
              <kbd className="kdb px-1.5 py-0.5 rounded bg-bolt-elements-background-depth-2">Entrée</kbd> pour une nouvelle ligne
            </div>
          ) : null} */}

          <ExpoQrModal open={props.qrModalOpen} onClose={() => props.setQrModalOpen(false)} />
        </div>
      </div>
    </div>
  );
};

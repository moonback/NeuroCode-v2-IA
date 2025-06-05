import { Fragment, memo } from 'react';
import { Markdown } from '~/components/chat/Markdown';
import { workbenchStore } from '~/lib/stores/workbench';
import { WORK_DIR } from '~/utils/constants';

interface ContextViewProps {
  chatSummary?: string;
  codeContext?: string[];
}

function openArtifactInWorkbench(filePath: string) {
  let normalizedPath = filePath;

  if (normalizedPath.startsWith(WORK_DIR)) {
    normalizedPath = filePath.replace(WORK_DIR, '');
  }

  if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.slice(1);
  }

  if (workbenchStore.currentView.get() !== 'code') {
    workbenchStore.currentView.set('code');
  }

  workbenchStore.setSelectedFile(`${WORK_DIR}/${normalizedPath}`);
}

export const ContextView = memo(({ chatSummary, codeContext }: ContextViewProps) => {
  return (
    <div className="h-full flex flex-col bg-bolt-elements-background-depth-1">
      <div className="flex-1 overflow-y-auto p-4">
        {chatSummary && (
          <div className="mb-6">
            <div className="summary max-h-96 flex flex-col">
              <h2 className="text-lg font-semibold mb-3 text-bolt-elements-textPrimary border border-bolt-elements-borderColor rounded-md p-3 bg-bolt-elements-background-depth-2">
                Summary
              </h2>
              <div 
                style={{ zoom: 0.9 }} 
                className="overflow-y-auto p-3 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-md"
              >
                <Markdown>{chatSummary}</Markdown>
              </div>
            </div>
          </div>
        )}
        
        {codeContext && codeContext.length > 0 && (
          <div className="code-context">
            <h2 className="text-lg font-semibold mb-3 text-bolt-elements-textPrimary border border-bolt-elements-borderColor rounded-md p-3 bg-bolt-elements-background-depth-2">
              Context Files
            </h2>
            <div className="grid gap-2">
              {codeContext.map((filePath) => {
                let normalizedPath = filePath;
                
                if (normalizedPath.startsWith(WORK_DIR)) {
                  normalizedPath = filePath.replace(WORK_DIR, '');
                }
                
                if (normalizedPath.startsWith('/')) {
                  normalizedPath = normalizedPath.slice(1);
                }
                
                return (
                  <Fragment key={normalizedPath}>
                    <button
                      className="text-left p-3 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-md hover:bg-bolt-elements-background-depth-3 transition-colors group"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openArtifactInWorkbench(normalizedPath);
                      }}
                    >
                      <code className="text-bolt-elements-item-contentAccent group-hover:underline text-sm font-mono">
                        {normalizedPath}
                      </code>
                    </button>
                  </Fragment>
                );
              })}
            </div>
          </div>
        )}
        
        {!chatSummary && (!codeContext || codeContext.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 mb-4 text-bolt-elements-textTertiary">
              <div className="i-ph:info text-4xl" />
            </div>
            <h3 className="text-lg font-medium text-bolt-elements-textPrimary mb-2">
              No Context Available
            </h3>
            <p className="text-sm text-bolt-elements-textTertiary max-w-md">
              Context information will appear here when available from chat messages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
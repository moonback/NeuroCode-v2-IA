import { type UIEvent } from 'react';
import type { Message } from 'ai';
import { FigmaImport } from './FigmaImport';

const EXAMPLE_PROMPTS = [
  { text: 'Build a mobile app' },
  { text: 'Start a blog' },
  { text: 'Create a docs site' },
  { text: 'Make a dashboard with charts' },
];

interface ExamplePromptsProps {
  sendMessage?: (event: UIEvent, messageInput?: string) => void | undefined;
  importChat?: (description: string, messages: Message[]) => Promise<void>;
}

export function ExamplePrompts({ sendMessage, importChat }: ExamplePromptsProps) {
  const handleGitHubImport = () => {
    // TODO: Implement GitHub import functionality
    console.log('GitHub import clicked');
  };

  return (
    <div id="examples" className="relative flex flex-col gap-9 w-full max-w-3xl mx-auto flex justify-center mt-6">
      <div
        className="flex flex-wrap justify-center gap-2"
        style={{
          animation: '.25s ease-out 0s 1 _fade-and-move-in_g2ptj_1 forwards',
        }}
      >
        {EXAMPLE_PROMPTS.map((examplePrompt, index: number) => {
          return (
            <button
              key={index}
              onClick={(event) => {
                sendMessage?.(event, examplePrompt.text);
              }}
              className="border border-bolt-elements-borderColor rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-900 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary px-4 py-2 text-sm transition-theme"
            >
              {examplePrompt.text}
            </button>
          );
        })}
      </div>
      
      {/* Import Section */}
      <div className="flex flex-col items-center gap-4">
        <div className="text-bolt-elements-textSecondary text-sm">
          or import from
        </div>
        <div className="flex gap-3">
          <FigmaImport onImport={importChat} />
          <button
            onClick={handleGitHubImport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-bolt-elements-borderColor bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-900 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary text-sm transition-theme"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </button>
        </div>
      </div>
    </div>
  );
}

import { type UIEvent } from 'react';
import type { Message } from 'ai';
import { FigmaImport } from './FigmaImport';

const EXAMPLE_PROMPTS = [
  { text: 'Create a mobile app about NeuroCode' },
  { text: 'Build a todo app in React using Tailwind' },
  { text: 'Build a simple blog using Astro' },
  { text: 'Create a cookie consent form using Material UI for Neurocode' },
  { text: 'Make a space invaders game' },
  { text: 'Make a Tic Tac Toe game in html, css and js only' },
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
        ou importer depuis
        </div>
        <div className="flex gap-3">
          <FigmaImport onImport={importChat} />
          
        </div>
      </div>
    </div>
  );
}

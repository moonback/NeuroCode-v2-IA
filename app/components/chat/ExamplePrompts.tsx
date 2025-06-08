import { type UIEvent } from 'react';

const EXAMPLE_PROMPTS = [
  { text: 'Create a modern landing page for a tech startup' },
  { text: 'Design a landing page for a luxury real estate company' },
  { text: 'Build a landing page for a fitness coaching service' },
  { text: 'Make a landing page for a digital marketing agency' },
  { text: 'Design a landing page for an online learning platform' },
  { text: 'Create a landing page for a restaurant delivery service' },
];

export function ExamplePrompts(sendMessage?: { (event: UIEvent, messageInput?: string): void | undefined }) {
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
              className="border border-bolt-elements-borderColor rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-900 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary px-3 py-1 text-xs transition-theme"
            >
              {examplePrompt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import type { Message } from 'ai';
import { generateId } from './fileUtils';

export interface ProjectCommands {
  type: string;
  setupCommand?: string;
  startCommand?: string;
  followupMessage: string;
}

interface FileContent {
  content: string;
  path: string;
}

export async function detectProjectCommands(files: FileContent[]): Promise<ProjectCommands> {
  const hasFile = (name: string) => files.some((f) => f.path.endsWith(name));

  if (hasFile('package.json')) {
    const packageJsonFile = files.find((f) => f.path.endsWith('package.json'));

    if (!packageJsonFile) {
      return { type: '', setupCommand: '', followupMessage: '' };
    }

    try {
      const packageJson = JSON.parse(packageJsonFile.content);
      const scripts = packageJson?.scripts || {};

      // Check for preferred commands in priority order
      const preferredCommands = ['dev', 'start', 'preview'];
      const availableCommand = preferredCommands.find((cmd) => scripts[cmd]);

      if (availableCommand) {
        return {
          type: 'Node.js',
          setupCommand: `npm install`,
          startCommand: `npm run ${availableCommand}`,
          followupMessage: `Found "${availableCommand}" script in package.json. Running "npm run ${availableCommand}" after installation.`,
        };
      }

      return {
        type: 'Node.js',
        setupCommand: 'npm install',
        followupMessage:
          'Would you like me to inspect package.json to determine the available scripts for running this project?',
      };
    } catch (error) {
      console.error('Error parsing package.json:', error);
      return { type: '', setupCommand: '', followupMessage: '' };
    }
  }

  if (hasFile('index.html')) {
    return {
      type: 'Static',
      startCommand: 'npx --yes serve',
      followupMessage: '',
    };
  }

  return { type: '', setupCommand: '', followupMessage: '' };
}

export function createCommandsMessage(commands: ProjectCommands): Message | null {
  if (!commands.setupCommand && !commands.startCommand) {
    return null;
  }

  let commandString = '';

  if (commands.setupCommand) {
    commandString += `
<boltAction type="shell">${commands.setupCommand}</boltAction>`;
  }

  if (commands.startCommand) {
    commandString += `
<boltAction type="start">${commands.startCommand}</boltAction>
`;
  }

  return {
    role: 'assistant',
    content: `
${commands.followupMessage ? `\n\n${commands.followupMessage}` : ''}
<boltArtifact id="project-setup" title="Project Setup">
${commandString}
</boltArtifact>`,
    id: generateId(),
    createdAt: new Date(),
  };
}

export function escapeBoltArtifactTags(input: string) {
  // Regular expression to match correctly formed boltArtifact tags and their content
  const validRegex = /(<boltArtifact[^>]*>)([\s\S]*?)(<\/boltArtifact>)/g;
  
  // Regular expression to match malformed boltArtifact tags (typos, incomplete tags)
  const malformedRegex = /(<(?:boltArtifacs|oltArtfiact|boltArtifactt|bolt[A-Za-z]*)[^>]*>)([\s\S]*?)(<\/(?:boltArtifacs|oltArtfiact|boltArtifactt|bolt[A-Za-z]*|boltArtifact)>)/g;
  
  // First, handle malformed tags by escaping them completely
  let result = input.replace(malformedRegex, (match, openTag, content, closeTag) => {
    const escapedOpenTag = openTag.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedCloseTag = closeTag.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `${escapedOpenTag}${content}${escapedCloseTag}`;
  });
  
  // Then handle valid boltArtifact tags
  result = result.replace(validRegex, (match, openTag, content, closeTag) => {
    // Escape the opening tag
    const escapedOpenTag = openTag.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Escape the closing tag
    const escapedCloseTag = closeTag.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Return the escaped version
    return `${escapedOpenTag}${content}${escapedCloseTag}`;
  });
  
  return result;
}

export function escapeBoltAActionTags(input: string) {
  // Regular expression to match correctly formed boltAction tags and their content
  const validRegex = /(<boltAction[^>]*>)([\s\S]*?)(<\/boltAction>)/g;
  
  // Regular expression to match malformed boltAction tags
  const malformedRegex = /(<(?:boltActions|oltAction|boltActionn|bolt[A-Za-z]*Action[A-Za-z]*)[^>]*>)([\s\S]*?)(<\/(?:boltActions|oltAction|boltActionn|bolt[A-Za-z]*Action[A-Za-z]*|boltAction)>)/g;
  
  // First, handle malformed tags by escaping them completely
  let result = input.replace(malformedRegex, (match, openTag, content, closeTag) => {
    const escapedOpenTag = openTag.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedCloseTag = closeTag.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `${escapedOpenTag}${content}${escapedCloseTag}`;
  });
  
  // Then handle valid boltAction tags
  result = result.replace(validRegex, (match, openTag, content, closeTag) => {
    // Escape the opening tag
    const escapedOpenTag = openTag.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Escape the closing tag
    const escapedCloseTag = closeTag.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Return the escaped version
    return `${escapedOpenTag}${content}${escapedCloseTag}`;
  });
  
  return result;
}

/**
 * Validates and fixes common boltArtifact tag formatting issues
 * @param input - The input string to validate
 * @returns The input with corrected boltArtifact tags
 */
export function validateBoltArtifactTags(input: string): string {
  if (!input) return input;
  
  let result = input;
  
  // Fix common typos in opening tags
  const typoFixes = [
    { from: /<boltArtifacs([^>]*)>/g, to: '<boltArtifact$1>' },
    { from: /<oltArtfiact([^>]*)>/g, to: '<boltArtifact$1>' },
    { from: /<boltArtifactt([^>]*)>/g, to: '<boltArtifact$1>' },
    { from: /<boltartifact([^>]*)>/g, to: '<boltArtifact$1>' }, // lowercase
    { from: /<BoltArtifact([^>]*)>/g, to: '<boltArtifact$1>' }, // wrong case
  ];
  
  // Fix common typos in closing tags
  const closingTypoFixes = [
    { from: /<\/boltArtifacs>/g, to: '</boltArtifact>' },
    { from: /<\/oltArtfiact>/g, to: '</boltArtifact>' },
    { from: /<\/boltArtifactt>/g, to: '</boltArtifact>' },
    { from: /<\/boltartifact>/g, to: '</boltArtifact>' },
    { from: /<\/BoltArtifact>/g, to: '</boltArtifact>' },
  ];
  
  // Apply all fixes
  [...typoFixes, ...closingTypoFixes].forEach(({ from, to }) => {
    result = result.replace(from, to);
  });
  
  return result;
}

export function escapeBoltTags(input: string) {
  // First validate and fix common issues, then escape
  const validatedInput = validateBoltArtifactTags(input);
  return escapeBoltArtifactTags(escapeBoltAActionTags(validatedInput));
}

// We have this seperate function to simplify the restore snapshot process in to one single artifact.
export function createCommandActionsString(commands: ProjectCommands): string {
  if (!commands.setupCommand && !commands.startCommand) {
    // Return empty string if no commands
    return '';
  }

  let commandString = '';

  if (commands.setupCommand) {
    commandString += `
<boltAction type="shell">${commands.setupCommand}</boltAction>`;
  }

  if (commands.startCommand) {
    commandString += `
<boltAction type="start">${commands.startCommand}</boltAction>
`;
  }

  return commandString;
}

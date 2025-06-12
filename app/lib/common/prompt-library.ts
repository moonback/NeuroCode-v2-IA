import { getSystemPrompt } from './prompts/prompts';
import optimized from './prompts/optimized';
import { getFineTunedPrompt } from './prompts/new-prompt';
import type { DesignScheme } from '~/types/design-scheme';
import { getSmallLLMOptimizedPrompt } from './prompts/small-llm-optimized';

export interface PromptOptions {
  cwd: string;
  allowedHtmlElements: string[];
  modificationTagName: string;
  designScheme?: DesignScheme;
  supabase?: {
    isConnected: boolean;
    hasSelectedProject: boolean;
    credentials?: {
      anonKey?: string;
      supabaseUrl?: string;
    };
  };
}

export class PromptLibrary {
  static library: Record<
    string,
    {
      label: string;
      description: string;
      get: (options: PromptOptions) => string;
    }
  > = {
    default: {
      label: 'Prompt Officiel',
      description: 'Un prompt optimisé pour de meilleurs résultats et une utilisation réduite des tokens',
      get: (options) => getFineTunedPrompt(options.cwd, options.supabase, options.designScheme),
    },
    original: {
      label: 'Prompt par Défaut', 
      description: 'Le prompt système original éprouvé',
      get: (options) => getSystemPrompt(options.cwd, options.supabase, options.designScheme),
    },
    optimized: {
      label: 'Prompt Optimisé (expérimental)',
      description: 'Une version expérimentale du prompt pour une utilisation réduite des tokens',
      get: (options) => optimized(options),
    },
    smallLLMOptimized: {
      label: 'Prompt Optimisé (Français)',
      description: 'Une version expérimentale du prompt pour une utilisation réduite des tokens',
      get: (options) => getSmallLLMOptimizedPrompt(options.cwd, options.supabase, options.designScheme),
    },
  };
  static getList() {
    return Object.entries(this.library).map(([key, value]) => {
      const { label, description } = value;
      return {
        id: key,
        label,
        description,
      };
    });
  }
  static getPromptFromLibrary(promptId: string, options: PromptOptions) {
    const prompt = this.library[promptId];

    if (!prompt) {
      throw 'Prompt Not Found';
    }

    return this.library[promptId]?.get(options);
  }
}
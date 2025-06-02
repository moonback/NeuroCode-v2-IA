import { getSystemPrompt } from './prompts/prompts';
import optimized from './prompts/optimized';
import { getFineTunedPrompt } from './prompts/new-prompt';
import smallLlmOptimized from './prompts/small-llm-optimized';
// Type pour les prompts personnalisés stockés dans le localStorage
interface StoredCustomPrompt {
  id: string;
  label: string;
  description: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface PromptOptions {
  cwd: string;
  allowedHtmlElements: string[];
  modificationTagName: string;
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
      label: 'Original',
      description: 'Il s\'agit du système par défaut testé au combat.',
      get: (options) => getSystemPrompt(options.cwd, options.supabase),
    },
    enhanced: {
      label: 'Fine Tuned ',
      description: 'Un prompt fine-tuned pour des résultats encore meilleurs',
      get: (options) => getFineTunedPrompt(options.cwd, options.supabase),
    },
    optimized: {
      label: 'Optimized (expérimental)',
      description: 'Une version expérimentale du prompt pour une utilisation moins intensive des jetons',
      get: (options) => optimized(options),
    },
    'small-llm-optimized': {
      label: 'Small LLM Optimized',
      description: 'A simplified prompt optimized for smaller Language Models, focusing on reliable artifact generation.',
      get: (options) => smallLlmOptimized(options),
    },
  };
  
  // Récupérer les prompts personnalisés depuis le localStorage
  private static getCustomPrompts(): StoredCustomPrompt[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const savedPrompts = localStorage.getItem('bolt_custom_prompts');
      return savedPrompts ? JSON.parse(savedPrompts) : [];
    } catch (error) {
      console.error('Erreur lors du chargement des prompts personnalisés:', error);
      return [];
    }
  }
  static getList() {
    // Récupérer les prompts de la bibliothèque standard
    const standardPrompts = Object.entries(this.library).map(([key, value]) => {
      const { label, description } = value;
      return {
        id: key,
        label,
        description,
      };
    });
    
    // Récupérer les prompts personnalisés
    const customPrompts = this.getCustomPrompts().map(prompt => ({
      id: prompt.id,
      label: prompt.label,
      description: prompt.description,
    }));
    
    // Combiner les deux types de prompts
    return [...standardPrompts, ...customPrompts];
  }
  static getPropmtFromLibrary(promptId: string, options: PromptOptions) {
    // Vérifier si c'est un prompt standard
    const standardPrompt = this.library[promptId];
    if (standardPrompt) {
      return standardPrompt.get(options);
    }
    
    // Vérifier si c'est un prompt personnalisé
    if (promptId.startsWith('custom_')) {
      const customPrompts = this.getCustomPrompts();
      const customPrompt = customPrompts.find(p => p.id === promptId);
      
      if (customPrompt) {
        // Retourner directement le contenu du prompt personnalisé
        return customPrompt.content;
      }
    }

    // Si le prompt n'est pas trouvé, utiliser le prompt par défaut
    console.warn(`Prompt "${promptId}" non trouvé, utilisation du prompt par défaut`);
    return this.library['default'].get(options);
  }
}

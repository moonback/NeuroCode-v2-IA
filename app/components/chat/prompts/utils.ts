import type { PromptTemplate } from './templates';

export const generateFormattedPrompt = (template: PromptTemplate): string => {
  let prompt = `${template.base}\n\n`;
  
  template.sections.forEach(section => {
    prompt += `**${section.title}**\n`;
    section.items.forEach(item => {
      prompt += `- ${item}\n`;
    });
    prompt += '\n';
  });

  if (template.conclusion) {
    prompt += template.conclusion;
  }

  return prompt;
};

export const enrichPromptWithContext = (prompt: string, context: {
  model?: string;
  provider?: string;
  imageContext?: string;
}): string => {
  const contextHeader = [
    context.model && `[Model: ${context.model}]`,
    context.provider && `[Provider: ${context.provider}]`,
    context.imageContext && `[Image Context: ${context.imageContext}]`,
  ].filter(Boolean).join('\n');

  return contextHeader ? `${contextHeader}\n\n${prompt}` : prompt;
};

export const addCustomInstructions = (prompt: string, instructions: string[]): string => {
  if (!instructions.length) return prompt;
  
  const customSection = '\n\n**Instructions personnalisées**\n' + 
    instructions.map(instruction => `- ${instruction}`).join('\n');
  
  return prompt + customSection;
};

export const validatePrompt = (prompt: string): boolean => {
  const minLength = 50;
  const maxLength = 2000;
  
  if (prompt.length < minLength) {
    console.warn(`Le prompt est trop court (${prompt.length} caractères). Minimum recommandé : ${minLength}`);
    return false;
  }
  
  if (prompt.length > maxLength) {
    console.warn(`Le prompt est trop long (${prompt.length} caractères). Maximum recommandé : ${maxLength}`);
    return false;
  }
  
  // Vérification de la structure markdown
  const hasSections = prompt.includes('**') && prompt.includes('- ');
  if (!hasSections) {
    console.warn('Le prompt devrait contenir des sections formatées en markdown');
    return false;
  }
  
  return true;
};

export const validateReactImports = (code: string): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Vérification de l'import de React
  if (!code.includes('import React')) {
    issues.push('Import React manquant : ajouter "import React from \'react\'"');
  }

  // Vérification des imports de hooks courants
  const commonHooks = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef'];
  const usedHooks = commonHooks.filter(hook => code.includes(hook));
  const importedHooks = code.match(/import\s+{([^}]+)}\s+from\s+['"]react['"]/);
  
  if (usedHooks.length > 0 && !importedHooks) {
    issues.push(`Hooks utilisés mais non importés : ${usedHooks.join(', ')}`);
  }

  // Vérification des types React
  if (code.includes('FC') || code.includes('ReactNode')) {
    if (!code.includes('import type')) {
      issues.push('Types React utilisés mais non importés : ajouter "import type { FC, ReactNode } from \'react\'"');
    }
  }

  // Vérification des composants
  const componentDefinitions = code.match(/function\s+([A-Z][a-zA-Z]*)|const\s+([A-Z][a-zA-Z]*)\s*=/g);
  if (componentDefinitions) {
    if (!code.includes('React.FC') && !code.includes('FunctionComponent')) {
      issues.push('Composants définis sans typage React.FC ou FunctionComponent');
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
};

export const validateGeneratedCode = (code: string): boolean => {
  const reactValidation = validateReactImports(code);
  
  if (!reactValidation.isValid) {
    console.warn('Problèmes détectés dans le code généré :');
    reactValidation.issues.forEach(issue => console.warn(`- ${issue}`));
    return false;
  }

  return true;
}; 
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
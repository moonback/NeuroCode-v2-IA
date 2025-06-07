/**
 * Utilitaire pour extraire intelligemment le raisonnement des modèles thinking
 */

export interface ReasoningExtractionResult {
  content: string;
  originalLength: number;
  extractionMethod: 'explicit' | 'pattern' | 'heuristic' | 'fallback';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Extrait le raisonnement d'un contenu de réponse de modèle thinking
 * @param content Le contenu complet de la réponse
 * @param maxLength Longueur maximale du raisonnement extrait
 * @returns Le raisonnement extrait avec métadonnées ou null si aucun raisonnement trouvé
 */
export function extractReasoning(
  content: string,
  maxLength: number = 2000
): ReasoningExtractionResult | null {
  if (!content || content.trim().length === 0) {
    return null;
  }

  const originalLength = content.length;
  let extractedContent = '';
  let extractionMethod: ReasoningExtractionResult['extractionMethod'] = 'fallback';
  let confidence: ReasoningExtractionResult['confidence'] = 'low';

  // 1. Recherche de balises explicites de raisonnement (améliorée)
  const explicitPatterns = [
    /<thinking[^>]*>([\s\S]*?)<\/thinking>/gi,
    /<thought[^>]*>([\s\S]*?)<\/thought>/gi,
    /<reasoning[^>]*>([\s\S]*?)<\/reasoning>/gi,
    /<analyse[^>]*>([\s\S]*?)<\/analyse>/gi,
    /<reflection[^>]*>([\s\S]*?)<\/reflection>/gi,
    /\[THINKING\]([\s\S]*?)\[\/THINKING\]/gi,
    /\[REASONING\]([\s\S]*?)\[\/REASONING\]/gi,
    /\[ANALYSE\]([\s\S]*?)\[\/ANALYSE\]/gi
  ];

  for (const pattern of explicitPatterns) {
    const matches = Array.from(content.matchAll(pattern));
    if (matches.length > 0) {
      extractedContent = matches.map(match => match[1]).join('\n\n').trim();
      extractionMethod = 'explicit';
      confidence = 'high';
      break;
    }
  }

  // 2. Si pas de balises explicites, chercher au début du contenu (amélioré)
  if (!extractedContent) {
    const fullContent = content.trim();
    // Vérifier si le contenu commence par une balise thinking ou analyse
    const startPatterns = [
      /^\s*<thinking[^>]*>([\s\S]*?)<\/thinking>/i,
      /^\s*<reasoning[^>]*>([\s\S]*?)<\/reasoning>/i,
      /^\s*<analyse[^>]*>([\s\S]*?)<\/analyse>/i,
      /^\s*<reflection[^>]*>([\s\S]*?)<\/reflection>/i
    ];
    
    for (const pattern of startPatterns) {
      const match = fullContent.match(pattern);
      if (match) {
        extractedContent = match[1].trim();
        extractionMethod = 'explicit';
        confidence = 'high';
        break;
      }
    }
  }

  // 3. Recherche de patterns de structure (étendue)
  if (!extractedContent) {
    const structurePatterns = [
      /\*\*Thinking\*\*:?([\s\S]*?)(?=\n\n\*\*|\n\n[A-Z]|$)/gi,
      /\*\*Raisonnement\*\*:?([\s\S]*?)(?=\n\n\*\*|\n\n[A-Z]|$)/gi,
      /\*\*Analyse\*\*:?([\s\S]*?)(?=\n\n\*\*|\n\n[A-Z]|$)/gi,
      /\*\*Réflexion\*\*:?([\s\S]*?)(?=\n\n\*\*|\n\n[A-Z]|$)/gi,
      /\*\*Approche\*\*:?([\s\S]*?)(?=\n\n\*\*|\n\n[A-Z]|$)/gi,
      /Thinking:([\s\S]*?)(?=\n\n(?:Response|Solution|Answer|Implementation):|$)/gi,
      /Raisonnement:([\s\S]*?)(?=\n\n(?:Réponse|Solution|Résultat|Implémentation):|$)/gi,
      /Analyse:([\s\S]*?)(?=\n\n(?:Réponse|Solution|Résultat|Implémentation):|$)/gi,
      /## Analyse([\s\S]*?)(?=\n\n##|$)/gi,
      /## Raisonnement([\s\S]*?)(?=\n\n##|$)/gi,
      /# Thinking([\s\S]*?)(?=\n\n#|$)/gi
    ];

    for (const pattern of structurePatterns) {
      const matches = Array.from(content.matchAll(pattern));
      if (matches.length > 0) {
        extractedContent = matches.map(match => match[1]).join('\n\n').trim();
        extractionMethod = 'pattern';
        confidence = 'medium';
        break;
      }
    }
  }

  // 4. Extraction heuristique améliorée
  if (!extractedContent) {
    const heuristicResult = extractByHeuristic(content);
    if (heuristicResult) {
      extractedContent = heuristicResult.content;
      extractionMethod = 'heuristic';
      confidence = heuristicResult.confidence;
    }
  }

  // 5. Fallback intelligent : analyser la structure du début
  if (!extractedContent && isLikelyReasoning(content)) {
    const smartFallback = extractSmartFallback(content);
    if (smartFallback) {
      extractedContent = smartFallback.content;
      extractionMethod = 'fallback';
      confidence = smartFallback.confidence;
    }
  }

  if (!extractedContent) {
    return null;
  }

  // Nettoyer et structurer le contenu
  extractedContent = enhanceReasoningContent(extractedContent);
  
  if (extractedContent.length > maxLength) {
    extractedContent = extractedContent.substring(0, maxLength) + '\n\n[Raisonnement tronqué...]';
  }

  return {
    content: extractedContent,
    originalLength,
    extractionMethod,
    confidence
  };
}

/**
 * Extraction par heuristique basée sur la structure du contenu (améliorée)
 */
function extractByHeuristic(content: string): { content: string; confidence: ReasoningExtractionResult['confidence'] } | null {
  const lines = content.split('\n');
  const reasoningLines: string[] = [];
  let foundContent = false;
  let confidence: ReasoningExtractionResult['confidence'] = 'low';
  let reasoningScore = 0;

  for (let i = 0; i < lines.length && reasoningLines.length < 25; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      if (foundContent) reasoningLines.push(line); // Préserver les lignes vides dans le raisonnement
      continue;
    }

    // Indicateurs de fin de raisonnement (étendus)
    if (/^(Réponse|Response|Solution|Conclusion|Résultat|Result|Implémentation|Implementation|Code|Voici|Here's):/i.test(trimmedLine)) {
      break;
    }

    // Indicateurs de contenu de réponse (code, listes structurées)
    if (trimmedLine.startsWith('```') || 
        trimmedLine.startsWith('##') ||
        /^\d+\.|^[a-z]\)|^-\s|^\*\s/.test(trimmedLine)) {
      if (foundContent && reasoningLines.length > 5) {
        break; // On a déjà du contenu de raisonnement substantiel, on s'arrête
      }
      if (!foundContent) {
        continue; // On n'a pas encore trouvé de raisonnement, on continue
      }
    }

    // Indicateurs de raisonnement de qualité (étendus)
    const qualityIndicators = [
      /\b(analyser?|considérer|examiner|évaluer|réfléchir|penser)\b/i,
      /\b(donc|ainsi|par conséquent|en effet|cependant|néanmoins|toutefois)\b/i,
      /\b(premièrement|deuxièmement|d'abord|ensuite|enfin|finalement)\b/i,
      /\b(il faut|je dois|nous devons|il convient|il est important)\b/i,
      /\b(problème|défi|enjeu|difficulté|solution|approche|stratégie)\b/i,
      /\b(thinking|reasoning|analysis|consideration|approach|strategy)\b/i,
      /\b(L'utilisateur|The user|La demande|The request|L'objectif|The goal)\b/i
    ];

    for (const indicator of qualityIndicators) {
      if (indicator.test(trimmedLine)) {
        reasoningScore++;
        if (reasoningScore >= 2) confidence = 'medium';
        if (reasoningScore >= 4) confidence = 'high';
        break;
      }
    }

    // Détecter les questions rhétoriques (indicateur de réflexion)
    if (/\?\s*$/.test(trimmedLine) && trimmedLine.length > 10) {
      reasoningScore++;
    }

    reasoningLines.push(line);
    foundContent = true;
  }

  if (reasoningLines.length < 3 || reasoningScore === 0) {
    return null;
  }

  return {
    content: reasoningLines.join('\n').trim(),
    confidence
  };
}

/**
 * Extraction intelligente de fallback
 */
function extractSmartFallback(content: string): { content: string; confidence: ReasoningExtractionResult['confidence'] } | null {
  const lines = content.split('\n');
  const reasoningLines: string[] = [];
  let confidence: ReasoningExtractionResult['confidence'] = 'low';
  
  // Chercher les premiers paragraphes qui semblent être du raisonnement
  let currentParagraph: string[] = [];
  let paragraphCount = 0;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      if (currentParagraph.length > 0) {
        const paragraphText = currentParagraph.join('\n');
        if (isLikelyReasoning(paragraphText)) {
          reasoningLines.push(...currentParagraph, '');
          paragraphCount++;
          if (paragraphCount >= 3) break; // Limiter à 3 paragraphes
        }
        currentParagraph = [];
      }
    } else {
      currentParagraph.push(line);
      
      // Arrêter si on trouve des indicateurs de code ou de réponse finale
      if (trimmedLine.startsWith('```') || 
          /^(Voici|Here's|Solution|Résultat)/.test(trimmedLine)) {
        break;
      }
    }
  }
  
  // Traiter le dernier paragraphe
  if (currentParagraph.length > 0 && paragraphCount < 3) {
    const paragraphText = currentParagraph.join('\n');
    if (isLikelyReasoning(paragraphText)) {
      reasoningLines.push(...currentParagraph);
      paragraphCount++;
    }
  }
  
  if (paragraphCount >= 2) confidence = 'medium';
  if (paragraphCount >= 3) confidence = 'high';
  
  return reasoningLines.length > 0 ? {
    content: reasoningLines.join('\n').trim(),
    confidence
  } : null;
}

/**
 * Nettoie le contenu du raisonnement
 */
function cleanReasoningContent(content: string): string {
  return content
    .replace(/^\s*[-*]\s*/gm, '') // Supprimer les puces en début de ligne
    .replace(/\n{3,}/g, '\n\n') // Réduire les sauts de ligne multiples
    .replace(/^\s+|\s+$/g, '') // Trim global
    .replace(/\t/g, '  ') // Remplacer les tabs par des espaces
    .replace(/\*\*(.*?)\*\*/g, '**$1**') // Normaliser le gras
    .replace(/_{2,}/g, '') // Supprimer les underscores multiples
    .replace(/\s+([.!?])/g, '$1'); // Corriger l'espacement avant la ponctuation
}

/**
 * Améliore et structure le contenu du raisonnement
 */
function enhanceReasoningContent(content: string): string {
  let enhanced = cleanReasoningContent(content);
  
  // Ajouter des sections si le contenu est long et non structuré
  if (enhanced.length > 500 && !enhanced.includes('##') && !enhanced.includes('**')) {
    const paragraphs = enhanced.split('\n\n').filter(p => p.trim());
    
    if (paragraphs.length >= 3) {
      // Structurer en sections logiques
      const sections = [];
      
      // Première section : Analyse
      if (paragraphs[0]) {
        sections.push(`**🔍 Analyse**\n${paragraphs[0]}`);
      }
      
      // Sections intermédiaires : Réflexion
      for (let i = 1; i < paragraphs.length - 1; i++) {
        if (paragraphs[i]) {
          sections.push(`**💭 Réflexion ${i}**\n${paragraphs[i]}`);
        }
      }
      
      // Dernière section : Conclusion
      if (paragraphs[paragraphs.length - 1]) {
        sections.push(`**✅ Conclusion**\n${paragraphs[paragraphs.length - 1]}`);
      }
      
      enhanced = sections.join('\n\n');
    }
  }
  
  return enhanced;
}

/**
 * Supprime le raisonnement du contenu principal pour ne garder que le résultat
 * @param content Le contenu complet
 * @param extractedReasoning Le raisonnement extrait (optionnel)
 * @returns Le contenu nettoyé sans le raisonnement
 */
export function removeReasoningFromContent(
  content: string,
  extractedReasoning?: string
): string {
  if (!content || content.trim().length === 0) {
    return content;
  }

  let cleanedContent = content;

  // 1. Supprimer les balises explicites de raisonnement
  const explicitPatterns = [
    /<thinking[^>]*>[\s\S]*?<\/thinking>/gi,
    /<thought[^>]*>[\s\S]*?<\/thought>/gi,
    /<reasoning[^>]*>[\s\S]*?<\/reasoning>/gi,
    /<analyse[^>]*>[\s\S]*?<\/analyse>/gi,
    /<reflection[^>]*>[\s\S]*?<\/reflection>/gi,
    /\[THINKING\][\s\S]*?\[\/THINKING\]/gi,
    /\[REASONING\][\s\S]*?\[\/REASONING\]/gi,
    /\[ANALYSE\][\s\S]*?\[\/ANALYSE\]/gi
  ];

  for (const pattern of explicitPatterns) {
    cleanedContent = cleanedContent.replace(pattern, '');
  }

  // 2. Supprimer les sections de raisonnement structurées
  const structurePatterns = [
    /\*\*Thinking\*\*:?[\s\S]*?(?=\n\n\*\*|\n\n[A-Z]|$)/gi,
    /\*\*Raisonnement\*\*:?[\s\S]*?(?=\n\n\*\*|\n\n[A-Z]|$)/gi,
    /\*\*Analyse\*\*:?[\s\S]*?(?=\n\n\*\*|\n\n[A-Z]|$)/gi,
    /\*\*Réflexion\*\*:?[\s\S]*?(?=\n\n\*\*|\n\n[A-Z]|$)/gi,
    /\*\*Approche\*\*:?[\s\S]*?(?=\n\n\*\*|\n\n[A-Z]|$)/gi,
    /Thinking:[\s\S]*?(?=\n\n(?:Response|Solution|Answer|Implementation):|$)/gi,
    /Raisonnement:[\s\S]*?(?=\n\n(?:Réponse|Solution|Résultat|Implémentation):|$)/gi,
    /Analyse:[\s\S]*?(?=\n\n(?:Réponse|Solution|Résultat|Implémentation):|$)/gi,
    /## Analyse[\s\S]*?(?=\n\n##|$)/gi,
    /## Raisonnement[\s\S]*?(?=\n\n##|$)/gi,
    /# Thinking[\s\S]*?(?=\n\n#|$)/gi
  ];

  for (const pattern of structurePatterns) {
    cleanedContent = cleanedContent.replace(pattern, '');
  }

  // 3. Si un raisonnement spécifique a été extrait, le supprimer du contenu
  if (extractedReasoning && extractedReasoning.trim()) {
    // Nettoyer le raisonnement extrait pour la comparaison
    const cleanReasoning = extractedReasoning
      .replace(/\[Raisonnement tronqué...\]/g, '')
      .trim();
    
    if (cleanReasoning.length > 50) {
      // Chercher le raisonnement dans le contenu et le supprimer
      const reasoningLines = cleanReasoning.split('\n').slice(0, 5); // Prendre les 5 premières lignes
      for (const line of reasoningLines) {
        if (line.trim().length > 10) {
          const escapedLine = line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const linePattern = new RegExp(escapedLine, 'gi');
          cleanedContent = cleanedContent.replace(linePattern, '');
        }
      }
    }
  }

  // 4. Détecter et supprimer les sections de raisonnement au début du contenu
  const lines = cleanedContent.split('\n');
  let startIndex = 0;
  let foundReasoningEnd = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Détecter la fin du raisonnement et le début du contenu principal
    if (/^(Réponse|Response|Solution|Conclusion|Résultat|Result|Implémentation|Implementation|Voici|Here's):/i.test(line) ||
        /^(Maintenant|Now|Pour|To|Afin de|In order to)/i.test(line) ||
        line.startsWith('```') ||
        /^#{1,3}\s/.test(line)) {
      startIndex = i;
      foundReasoningEnd = true;
      break;
    }
    
    // Si on trouve du contenu structuré (code, listes), on s'arrête
    if (line.startsWith('```') || 
        /^\d+\.|^[a-z]\)|^-\s|^\*\s/.test(line) ||
        /^#{1,6}\s/.test(line)) {
      startIndex = i;
      foundReasoningEnd = true;
      break;
    }
  }

  // Si on a trouvé une fin de raisonnement, garder seulement le contenu après
  if (foundReasoningEnd && startIndex > 0) {
    cleanedContent = lines.slice(startIndex).join('\n');
  }

  // 5. Nettoyer les lignes vides excessives et les espaces
  cleanedContent = cleanedContent
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Réduire les lignes vides multiples
    .replace(/^\s+|\s+$/g, '') // Supprimer les espaces en début/fin
    .trim();

  return cleanedContent;
}

/**
 * Détermine si un contenu semble contenir du raisonnement (amélioré)
 */
export function isLikelyReasoning(content: string): boolean {
  const reasoningIndicators = [
    // Verbes de réflexion français
    /\b(analyser?|considérer|examiner|évaluer|réfléchir|penser|comprendre|déterminer)\b/i,
    // Connecteurs logiques français
    /\b(donc|ainsi|par conséquent|en effet|cependant|néanmoins|toutefois|d'ailleurs)\b/i,
    // Marqueurs de séquence français
    /\b(premièrement|deuxièmement|d'abord|ensuite|enfin|finalement|en premier lieu)\b/i,
    // Verbes de réflexion anglais
    /\b(thinking|reasoning|analysis|consideration|examining|evaluating|determining)\b/i,
    // Balises explicites
    /<thinking[^>]*>|<reasoning[^>]*>|<analyse[^>]*>|\[THINKING\]|\[REASONING\]|\[ANALYSE\]/i,
    // Détection spécifique des balises en début
    /^\s*<(thinking|reasoning|analyse)/i,
    // Patterns français typiques de raisonnement
    /L'utilisateur demande|Je dois analyser|Les options sont|La meilleure approche|Il faut considérer/i,
    // Patterns anglais typiques
    /The user is asking|I need to analyze|The options are|The best approach|We should consider/i,
    // Questions rhétoriques (indicateur de réflexion)
    /\b(Comment|Pourquoi|Que|Quel|How|Why|What|Which).{10,}\?/i,
    // Expressions de problématique
    /\b(problème|défi|enjeu|difficulté|challenge|issue|problem)\b/i,
    // Expressions de solution
    /\b(solution|approche|stratégie|méthode|approach|strategy|method)\b/i,
    // Marqueurs d'objectifs
    /\b(objectif|but|goal|aim|purpose|intention)\b/i
  ];

  // Compter le nombre d'indicateurs trouvés
  const matchCount = reasoningIndicators.reduce((count, pattern) => {
    return count + (pattern.test(content) ? 1 : 0);
  }, 0);

  // Vérifier la longueur minimale et le ratio de mots de raisonnement
  const words = content.split(/\s+/);
  const hasMinLength = words.length >= 10;
  const hasMultipleIndicators = matchCount >= 2;
  const hasSingleStrongIndicator = matchCount >= 1 && content.length > 100;

  return hasMinLength && (hasMultipleIndicators || hasSingleStrongIndicator);
}
/**
 * Utilitaire pour extraire intelligemment le raisonnement des modèles thinking
 */

export interface ReasoningExtractionResult {
  content: string;
  originalLength: number;
  extractionMethod: 'pattern' | 'heuristic' | 'fallback';
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Extrait le raisonnement d'un contenu de réponse de modèle thinking
 * @param fullContent Le contenu complet de la réponse
 * @param maxLength Longueur maximale du raisonnement extrait
 * @returns Résultat de l'extraction avec métadonnées
 */
export function extractReasoning(
  fullContent: string,
  maxLength: number = 2000
): ReasoningExtractionResult | null {
  if (!fullContent || fullContent.trim().length < 50) {
    return null;
  }

  const originalLength = fullContent.length;
  let extractedContent = '';
  let extractionMethod: ReasoningExtractionResult['extractionMethod'] = 'fallback';
  let confidence: ReasoningExtractionResult['confidence'] = 'low';

  // 1. Rechercher des balises de raisonnement explicites
  const explicitPatterns = [
    /<thinking[^>]*>([\s\S]*?)<\/thinking>/gi,
    /<think[^>]*>([\s\S]*?)<\/think>/gi,
    /<reasoning[^>]*>([\s\S]*?)<\/reasoning>/gi,
    /\[THINKING\]([\s\S]*?)\[\/THINKING\]/gi,
    /\[REASONING\]([\s\S]*?)\[\/REASONING\]/gi
  ];

  for (const pattern of explicitPatterns) {
    const matches = [...fullContent.matchAll(pattern)];
    if (matches.length > 0) {
      extractedContent = matches.map(match => match[1].trim()).join('\n\n');
      extractionMethod = 'pattern';
      confidence = 'high';
      break;
    }
  }

  // 2. Rechercher des marqueurs de raisonnement structurés
  if (!extractedContent) {
    const structuredPatterns = [
      /\*\*Raisonnement\*\*:?([\s\S]*?)(?=\n\n\*\*|\n\n[A-Z]|$)/gi,
      /\*\*Thinking\*\*:?([\s\S]*?)(?=\n\n\*\*|\n\n[A-Z]|$)/gi,
      /\*\*Analyse\*\*:?([\s\S]*?)(?=\n\n\*\*|\n\n[A-Z]|$)/gi,
      /Raisonnement:([\s\S]*?)(?=\n\n(?:Réponse|Solution|Conclusion):|$)/gi,
      /Thinking:([\s\S]*?)(?=\n\n(?:Response|Solution|Answer):|$)/gi,
      /Analyse:([\s\S]*?)(?=\n\n(?:Réponse|Solution|Conclusion):|$)/gi
    ];

    for (const pattern of structuredPatterns) {
      const matches = [...fullContent.matchAll(pattern)];
      if (matches.length > 0) {
        extractedContent = matches.map(match => match[1].trim()).join('\n\n');
        extractionMethod = 'pattern';
        confidence = 'medium';
        break;
      }
    }
  }

  // 3. Heuristique : analyser la structure du contenu
  if (!extractedContent) {
    const result = extractByHeuristic(fullContent);
    if (result) {
      extractedContent = result.content;
      extractionMethod = 'heuristic';
      confidence = result.confidence;
    }
  }

  // 4. Fallback : prendre le début du contenu
  if (!extractedContent) {
    const lines = fullContent.split('\n').slice(0, 10);
    extractedContent = lines.join('\n').trim();
    extractionMethod = 'fallback';
    confidence = 'low';
  }

  // Nettoyer et limiter la taille
  extractedContent = cleanReasoningContent(extractedContent);
  
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
 * Extraction par heuristique basée sur la structure du contenu
 */
function extractByHeuristic(content: string): { content: string; confidence: ReasoningExtractionResult['confidence'] } | null {
  const lines = content.split('\n');
  const reasoningLines: string[] = [];
  let foundContent = false;
  let confidence: ReasoningExtractionResult['confidence'] = 'medium';

  for (let i = 0; i < lines.length && reasoningLines.length < 20; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    if (!trimmedLine) continue;

    // Indicateurs de fin de raisonnement
    if (/^(Réponse|Response|Solution|Conclusion|Résultat|Result):/i.test(trimmedLine)) {
      break;
    }

    // Indicateurs de contenu de réponse (code, listes structurées)
    if (trimmedLine.startsWith('```') || 
        trimmedLine.startsWith('##') ||
        /^\d+\.|^[a-z]\)|^-\s|^\*\s/.test(trimmedLine)) {
      if (foundContent && reasoningLines.length > 3) {
        break; // On a déjà du contenu de raisonnement, on s'arrête
      }
      if (!foundContent) {
        continue; // On n'a pas encore trouvé de raisonnement, on continue
      }
    }

    // Indicateurs de raisonnement de qualité
    if (/\b(analyser?|considérer|examiner|évaluer|réfléchir|penser|donc|ainsi|par conséquent|en effet)\b/i.test(trimmedLine)) {
      confidence = 'medium';
    }

    reasoningLines.push(line);
    foundContent = true;
  }

  if (reasoningLines.length < 3) {
    return null;
  }

  return {
    content: reasoningLines.join('\n').trim(),
    confidence
  };
}

/**
 * Nettoie le contenu du raisonnement
 */
function cleanReasoningContent(content: string): string {
  return content
    .replace(/^\s*[-*]\s*/gm, '') // Supprimer les puces en début de ligne
    .replace(/\n{3,}/g, '\n\n') // Réduire les sauts de ligne multiples
    .replace(/^\s+|\s+$/g, '') // Trim global
    .replace(/\t/g, '  '); // Remplacer les tabs par des espaces
}

/**
 * Détermine si un contenu semble contenir du raisonnement
 */
export function isLikelyReasoning(content: string): boolean {
  const reasoningIndicators = [
    /\b(analyser?|considérer|examiner|évaluer|réfléchir|penser)\b/i,
    /\b(donc|ainsi|par conséquent|en effet|cependant|néanmoins)\b/i,
    /\b(premièrement|deuxièmement|d'abord|ensuite|enfin)\b/i,
    /\b(thinking|reasoning|analysis|consideration)\b/i,
    /<thinking|<reasoning|\[THINKING\]|\[REASONING\]/i
  ];

  return reasoningIndicators.some(pattern => pattern.test(content));
}
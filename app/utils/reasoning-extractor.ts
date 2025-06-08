/**
 * Utilitaire pour extraire intelligemment le raisonnement des modèles thinking
 */

export interface ReasoningExtractionResult {
  content: string;
  originalLength: number;
  extractionMethod: 'explicit' | 'pattern' | 'heuristic' | 'fallback';
  confidence: 'high' | 'medium' | 'low';
  patterns?: ReasoningPattern[];
  cacheKey?: string;
  streamingChunks?: string[];
}

export interface ReasoningPattern {
  type: 'question' | 'analysis' | 'decision' | 'step' | 'consideration' | 'conclusion';
  content: string;
  confidence: number;
  position: { start: number; end: number };
  keywords: string[];
}

export interface ReasoningCache {
  [key: string]: {
    result: ReasoningExtractionResult;
    timestamp: number;
    accessCount: number;
    contentHash: string;
  };
}

export interface StreamingExtractionState {
  buffer: string;
  extractedChunks: string[];
  currentPattern: string | null;
  confidence: number;
  isComplete: boolean;
}

// Cache intelligent pour les extractions de raisonnement
const reasoningCache: ReasoningCache = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 100;

// Patterns de raisonnement pour l'analyse
const REASONING_PATTERNS = {
  question: {
    patterns: [/\b(comment|pourquoi|que|quel|how|why|what|which).{10,}\?/gi, /\?.{0,20}$/gm],
    weight: 0.8
  },
  analysis: {
    patterns: [/\b(analyser?|examiner|évaluer|considérer|analysis|examine|evaluate|consider)\b/gi],
    weight: 0.9
  },
  decision: {
    patterns: [/\b(décider|choisir|opter|sélectionner|decide|choose|select|opt)\b/gi],
    weight: 0.85
  },
  step: {
    patterns: [/\b(étape|d'abord|ensuite|puis|enfin|step|first|then|next|finally)\b/gi],
    weight: 0.7
  },
  consideration: {
    patterns: [/\b(considération|aspect|facteur|élément|consideration|aspect|factor|element)\b/gi],
    weight: 0.6
  },
  conclusion: {
    patterns: [/\b(conclusion|résultat|donc|ainsi|par conséquent|conclusion|result|therefore|thus)\b/gi],
    weight: 0.8
  }
};

/**
 * Extrait le raisonnement d'un contenu de réponse de modèle thinking
 * @param content Le contenu complet de la réponse
 * @param maxLength Longueur maximale du raisonnement extrait
 * @param useCache Utiliser le cache intelligent (défaut: true)
 * @returns Le raisonnement extrait avec métadonnées ou null si aucun raisonnement trouvé
 */
export function extractReasoning(
  content: string,
  maxLength: number = 10000,
  useCache: boolean = true
): ReasoningExtractionResult | null {
  if (!content || content.trim().length === 0) {
    return null;
  }

  // Vérifier le cache en premier
  if (useCache) {
    const cacheKey = generateCacheKey(content);
    const cachedResult = getCachedReasoning(cacheKey, content);
    if (cachedResult) {
      return cachedResult;
    }
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
  
  // Troncature intelligente qui préserve les phrases complètes
  if (extractedContent.length > maxLength) {
    // Chercher le dernier point ou saut de ligne avant la limite
    let truncateAt = maxLength;
    const lastPeriod = extractedContent.lastIndexOf('.', maxLength - 100);
    const lastNewline = extractedContent.lastIndexOf('\n', maxLength - 50);
    
    // Utiliser le point le plus proche de la limite, mais pas trop près du début
    if (lastPeriod > maxLength * 0.7) {
      truncateAt = lastPeriod + 1;
    } else if (lastNewline > maxLength * 0.8) {
      truncateAt = lastNewline;
    }
    
    extractedContent = extractedContent.substring(0, truncateAt).trim() + '\n\n[Raisonnement tronqué pour la lisibilité...]';
  }

  // Analyser les patterns de raisonnement
  const patterns = analyzeReasoningPatterns(extractedContent);
  
  // Générer une clé de cache
  const cacheKey = generateCacheKey(content);
  
  const result: ReasoningExtractionResult = {
    content: extractedContent,
    originalLength,
    extractionMethod,
    confidence,
    patterns,
    cacheKey
  };
  
  // Mettre en cache le résultat
  cacheReasoningResult(cacheKey, result, content);
  
  return result;
}

/**
 * Cache intelligent pour les extractions de raisonnement
 */
function generateCacheKey(content: string): string {
  // Créer une clé basée sur un hash du contenu
  const contentHash = simpleHash(content.substring(0, 500)); // Utiliser les 500 premiers caractères
  return `reasoning_${contentHash}_${content.length}`;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir en 32bit integer
  }
  return Math.abs(hash).toString(36);
}

function cacheReasoningResult(cacheKey: string, result: ReasoningExtractionResult, content: string): void {
  // Nettoyer le cache si nécessaire
  cleanupCache();
  
  const contentHash = simpleHash(content);
  reasoningCache[cacheKey] = {
    result,
    timestamp: Date.now(),
    accessCount: 1,
    contentHash
  };
}

function getCachedReasoning(cacheKey: string, content: string): ReasoningExtractionResult | null {
  const cached = reasoningCache[cacheKey];
  if (!cached) return null;
  
  // Vérifier la validité du cache
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    delete reasoningCache[cacheKey];
    return null;
  }
  
  // Vérifier que le contenu n'a pas changé
  const contentHash = simpleHash(content);
  if (cached.contentHash !== contentHash) {
    delete reasoningCache[cacheKey];
    return null;
  }
  
  // Mettre à jour les statistiques d'accès
  cached.accessCount++;
  cached.timestamp = now;
  
  return cached.result;
}

function cleanupCache(): void {
  const now = Date.now();
  const cacheKeys = Object.keys(reasoningCache);
  
  // Supprimer les entrées expirées
  for (const key of cacheKeys) {
    if (now - reasoningCache[key].timestamp > CACHE_TTL) {
      delete reasoningCache[key];
    }
  }
  
  // Si le cache est encore trop grand, supprimer les moins utilisées
  const remainingKeys = Object.keys(reasoningCache);
  if (remainingKeys.length > MAX_CACHE_SIZE) {
    const sortedKeys = remainingKeys.sort((a, b) => {
      const aEntry = reasoningCache[a];
      const bEntry = reasoningCache[b];
      // Trier par fréquence d'accès puis par timestamp
      if (aEntry.accessCount !== bEntry.accessCount) {
        return aEntry.accessCount - bEntry.accessCount;
      }
      return aEntry.timestamp - bEntry.timestamp;
    });
    
    // Supprimer les 20% les moins utilisées
    const toRemove = Math.floor(sortedKeys.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      delete reasoningCache[sortedKeys[i]];
    }
  }
}

/**
 * Analyse les patterns de raisonnement dans le contenu
 */
function analyzeReasoningPatterns(content: string): ReasoningPattern[] {
  const patterns: ReasoningPattern[] = [];
  
  for (const [patternType, config] of Object.entries(REASONING_PATTERNS)) {
    for (const regex of config.patterns) {
      const matches = Array.from(content.matchAll(regex));
      
      for (const match of matches) {
        if (match.index !== undefined) {
          const matchContent = match[0];
          const start = match.index;
          const end = start + matchContent.length;
          
          // Extraire les mots-clés du match
          const keywords = extractKeywords(matchContent);
          
          // Calculer la confiance basée sur le contexte
          const contextConfidence = calculateContextConfidence(content, start, end);
          const finalConfidence = config.weight * contextConfidence;
          
          patterns.push({
            type: patternType as ReasoningPattern['type'],
            content: matchContent.trim(),
            confidence: finalConfidence,
            position: { start, end },
            keywords
          });
        }
      }
    }
  }
  
  // Trier par confiance décroissante
  return patterns.sort((a, b) => b.confidence - a.confidence);
}

function extractKeywords(content: string): string[] {
  const words = content.toLowerCase().match(/\b\w{3,}\b/g) || [];
  const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 
                             'le', 'la', 'les', 'et', 'ou', 'mais', 'dans', 'sur', 'pour', 'avec', 'par']);
  
  return words.filter(word => !stopWords.has(word) && word.length > 3);
}

function calculateContextConfidence(content: string, start: number, end: number): number {
  const contextRadius = 100;
  const contextStart = Math.max(0, start - contextRadius);
  const contextEnd = Math.min(content.length, end + contextRadius);
  const context = content.substring(contextStart, contextEnd);
  
  let confidence = 0.5; // Base confidence
  
  // Bonus pour les indicateurs de raisonnement dans le contexte
  const reasoningIndicators = [
    /\b(analyser?|considérer|examiner|évaluer)\b/gi,
    /\b(donc|ainsi|par conséquent|cependant)\b/gi,
    /\b(premièrement|deuxièmement|d'abord|ensuite)\b/gi
  ];
  
  for (const indicator of reasoningIndicators) {
    if (indicator.test(context)) {
      confidence += 0.1;
    }
  }
  
  // Bonus pour la longueur du contexte (plus de détails = plus de confiance)
  if (context.length > 200) confidence += 0.1;
  if (context.length > 400) confidence += 0.1;
  
  // Malus pour les indicateurs de code ou de réponse finale
  if (/```|\bcode\b|\bfunction\b|\bclass\b/i.test(context)) {
    confidence -= 0.2;
  }
  
  return Math.max(0, Math.min(1, confidence));
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

  for (let i = 0; i < lines.length && reasoningLines.length < 200; i++) {
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
      if (foundContent && reasoningLines.length > 10) {
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
        if (reasoningScore >= 3) confidence = 'high';
        break;
      }
    }

    // Détecter les questions rhétoriques (indicateur de réflexion)
    if (/\?\s*$/.test(trimmedLine) && trimmedLine.length > 10) {
      reasoningScore++;
    }

    // Bonus pour les lignes longues et détaillées (indicateur de raisonnement approfondi)
    if (trimmedLine.length > 80 && /\b(parce que|car|puisque|étant donné|considering|because|since)\b/i.test(trimmedLine)) {
      reasoningScore++;
    }

    // Bonus pour les connecteurs logiques multiples
    const logicalConnectors = (trimmedLine.match(/\b(donc|ainsi|par conséquent|cependant|néanmoins|toutefois|moreover|however|therefore)\b/gi) || []).length;
    if (logicalConnectors >= 2) {
      reasoningScore += logicalConnectors;
    }

    reasoningLines.push(line);
    foundContent = true;
  }

  // Critères plus flexibles pour accepter plus de raisonnements
  if (reasoningLines.length < 2 || (reasoningLines.length < 5 && reasoningScore === 0)) {
    return null;
  }

  // Bonus de confiance pour les raisonnements longs
  if (reasoningLines.length > 15) {
    if (confidence === 'low') confidence = 'medium';
    else if (confidence === 'medium') confidence = 'high';
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
  let totalReasoningLength = 0;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      if (currentParagraph.length > 0) {
        const paragraphText = currentParagraph.join('\n');
        if (isLikelyReasoning(paragraphText)) {
          reasoningLines.push(...currentParagraph, '');
          paragraphCount++;
          totalReasoningLength += paragraphText.length;
          // Augmenter la limite pour capturer plus de raisonnement
          if (paragraphCount >= 15 || totalReasoningLength > 8000) break;
        }
        currentParagraph = [];
      }
    } else {
      currentParagraph.push(line);
      
      // Arrêter si on trouve des indicateurs de code ou de réponse finale
      if (trimmedLine.startsWith('```') || 
          /^(Voici|Here's|Solution|Résultat|Implémentation|Code)/.test(trimmedLine)) {
        break;
      }
    }
  }
  
  // Traiter le dernier paragraphe
  if (currentParagraph.length > 0 && paragraphCount < 15) {
    const paragraphText = currentParagraph.join('\n');
    if (isLikelyReasoning(paragraphText)) {
      reasoningLines.push(...currentParagraph);
      paragraphCount++;
      totalReasoningLength += paragraphText.length;
    }
  }
  
  // Ajuster la confiance basée sur la quantité et la qualité
  if (paragraphCount >= 2 || totalReasoningLength > 500) confidence = 'medium';
  if (paragraphCount >= 4 || totalReasoningLength > 1500) confidence = 'high';
  
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
  if (enhanced.length > 300 && !enhanced.includes('##') && !enhanced.includes('**')) {
    const paragraphs = enhanced.split('\n\n').filter(p => p.trim() && p.length > 20);
    
    if (paragraphs.length >= 2) {
      // Structurer en sections logiques plus détaillées
      const sections = [];
      
      // Analyser le contenu pour identifier les types de sections
      const hasQuestions = enhanced.includes('?');
      const hasSteps = /\b(étape|step|d'abord|ensuite|puis|enfin|premièrement|deuxièmement)\b/i.test(enhanced);
      const hasOptions = /\b(option|alternative|possibilité|choix)\b/i.test(enhanced);
      
      if (paragraphs.length >= 4) {
        // Pour les raisonnements longs, créer plus de sections
        sections.push(`**🎯 Compréhension du problème**\n${paragraphs[0]}`);
        
        if (hasOptions && paragraphs[1]) {
          sections.push(`**⚖️ Analyse des options**\n${paragraphs[1]}`);
        } else if (hasSteps && paragraphs[1]) {
          sections.push(`**📋 Approche méthodologique**\n${paragraphs[1]}`);
        } else {
          sections.push(`**🔍 Analyse approfondie**\n${paragraphs[1]}`);
        }
        
        // Sections intermédiaires
        for (let i = 2; i < paragraphs.length - 1; i++) {
          if (paragraphs[i]) {
            const sectionTitle = hasSteps ? `**⚙️ Étape ${i - 1}**` : `**💭 Réflexion ${i - 1}**`;
            sections.push(`${sectionTitle}\n${paragraphs[i]}`);
          }
        }
        
        // Dernière section
        if (paragraphs[paragraphs.length - 1]) {
          sections.push(`**✅ Décision finale**\n${paragraphs[paragraphs.length - 1]}`);
        }
      } else {
        // Pour les raisonnements plus courts
        sections.push(`**🔍 Analyse**\n${paragraphs[0]}`);
        
        if (paragraphs[1]) {
          const conclusionTitle = hasQuestions ? '**❓ Évaluation**' : '**✅ Conclusion**';
          sections.push(`${conclusionTitle}\n${paragraphs[1]}`);
        }
        
        // Ajouter les paragraphes restants
        for (let i = 2; i < paragraphs.length; i++) {
          if (paragraphs[i]) {
            sections.push(`**💡 Considération supplémentaire**\n${paragraphs[i]}`);
          }
        }
      }
      
      enhanced = sections.join('\n\n');
    }
  }
  
  // Améliorer la lisibilité avec des espaces et formatage
  enhanced = enhanced
    .replace(/([.!?])([A-Z])/g, '$1 $2') // Ajouter des espaces après la ponctuation
    .replace(/\n{3,}/g, '\n\n') // Normaliser les sauts de ligne
    .trim();
  
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

/**
 * Extraction en streaming pour traiter le raisonnement au fur et à mesure
 */
export function createStreamingExtractor(): {
  processChunk: (chunk: string) => ReasoningExtractionResult | null;
  getState: () => StreamingExtractionState;
  finalize: () => ReasoningExtractionResult | null;
} {
  let state: StreamingExtractionState = {
    buffer: '',
    extractedChunks: [],
    currentPattern: null,
    confidence: 0,
    isComplete: false
  };

  const processChunk = (chunk: string): ReasoningExtractionResult | null => {
    if (state.isComplete) return null;

    state.buffer += chunk;
    
    // Détecter les balises de début de raisonnement
    const startPatterns = [
      /<thinking[^>]*>/i,
      /<reasoning[^>]*>/i,
      /<analyse[^>]*>/i,
      /\[THINKING\]/i,
      /\[REASONING\]/i
    ];

    // Détecter les balises de fin de raisonnement
    const endPatterns = [
      /<\/thinking>/i,
      /<\/reasoning>/i,
      /<\/analyse>/i,
      /\[\/THINKING\]/i,
      /\[\/REASONING\]/i
    ];

    // Si on n'a pas encore détecté de pattern, chercher le début
    if (!state.currentPattern) {
      for (const pattern of startPatterns) {
        const match = state.buffer.match(pattern);
        if (match) {
          state.currentPattern = match[0];
          // Extraire le contenu après la balise d'ouverture
          const startIndex = state.buffer.indexOf(match[0]) + match[0].length;
          const contentAfterTag = state.buffer.substring(startIndex);
          if (contentAfterTag.trim()) {
            state.extractedChunks.push(contentAfterTag);
          }
          break;
        }
      }
    } else {
      // On est dans un pattern de raisonnement, accumuler le contenu
      const newContent = chunk;
      
      // Vérifier si on a atteint la fin du raisonnement
      let endFound = false;
      for (const pattern of endPatterns) {
        if (pattern.test(state.buffer)) {
          endFound = true;
          // Extraire le contenu jusqu'à la balise de fin
          const endMatch = state.buffer.match(pattern);
          if (endMatch) {
            const endIndex = state.buffer.indexOf(endMatch[0]);
            const finalContent = state.buffer.substring(0, endIndex);
            // Nettoyer et ajouter le contenu final
            const cleanedContent = finalContent.replace(new RegExp(state.currentPattern, 'i'), '').trim();
            if (cleanedContent) {
              state.extractedChunks = [cleanedContent]; // Remplacer par le contenu complet
            }
          }
          state.isComplete = true;
          break;
        }
      }
      
      if (!endFound) {
        // Continuer à accumuler le contenu
        state.extractedChunks.push(newContent);
      }
    }

    // Calculer la confiance basée sur le contenu accumulé
    const accumulatedContent = state.extractedChunks.join('');
    if (accumulatedContent.length > 50) {
      state.confidence = calculateStreamingConfidence(accumulatedContent);
      
      // Retourner un résultat partiel si on a suffisamment de contenu
      if (accumulatedContent.length > 200 || state.isComplete) {
        return {
          content: accumulatedContent.trim(),
          originalLength: state.buffer.length,
          extractionMethod: state.currentPattern ? 'explicit' : 'pattern',
          confidence: state.confidence > 0.7 ? 'high' : state.confidence > 0.4 ? 'medium' : 'low',
          streamingChunks: [...state.extractedChunks],
          patterns: analyzeReasoningPatterns(accumulatedContent)
        };
      }
    }

    return null;
  };

  const getState = (): StreamingExtractionState => ({ ...state });

  const finalize = (): ReasoningExtractionResult | null => {
    const accumulatedContent = state.extractedChunks.join('').trim();
    if (!accumulatedContent) {
      // Essayer d'extraire avec les méthodes classiques
      return extractReasoning(state.buffer, 10000, false);
    }

    return {
      content: accumulatedContent,
      originalLength: state.buffer.length,
      extractionMethod: state.currentPattern ? 'explicit' : 'heuristic',
      confidence: state.confidence > 0.7 ? 'high' : state.confidence > 0.4 ? 'medium' : 'low',
      streamingChunks: state.extractedChunks,
      patterns: analyzeReasoningPatterns(accumulatedContent)
    };
  };

  return { processChunk, getState, finalize };
}

function calculateStreamingConfidence(content: string): number {
  let confidence = 0.3; // Base confidence pour le streaming
  
  // Bonus pour les indicateurs de raisonnement
  const reasoningWords = [
    /\b(analyser?|considérer|examiner|évaluer)\b/gi,
    /\b(donc|ainsi|par conséquent|cependant)\b/gi,
    /\b(premièrement|deuxièmement|d'abord|ensuite)\b/gi
  ];
  
  for (const pattern of reasoningWords) {
    const matches = content.match(pattern);
    if (matches) {
      confidence += matches.length * 0.1;
    }
  }
  
  // Bonus pour la structure
  if (content.includes('?')) confidence += 0.1;
  if (content.length > 100) confidence += 0.1;
  if (content.length > 300) confidence += 0.1;
  
  // Malus pour les indicateurs de code
  if (/```|\bfunction\b|\bclass\b|\bconst\b/i.test(content)) {
    confidence -= 0.2;
  }
  
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Analyse avancée des patterns de raisonnement avec métriques détaillées
 */
export function getReasoningAnalytics(content: string): {
  patterns: ReasoningPattern[];
  metrics: {
    totalPatterns: number;
    averageConfidence: number;
    dominantType: string;
    complexityScore: number;
    readabilityScore: number;
  };
  suggestions: string[];
} {
  const patterns = analyzeReasoningPatterns(content);
  
  // Calculer les métriques
  const totalPatterns = patterns.length;
  const averageConfidence = patterns.length > 0 
    ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length 
    : 0;
  
  // Trouver le type dominant
  const typeCounts = patterns.reduce((counts, pattern) => {
    counts[pattern.type] = (counts[pattern.type] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  const dominantType = Object.entries(typeCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';
  
  // Score de complexité basé sur la diversité des patterns
  const uniqueTypes = Object.keys(typeCounts).length;
  const complexityScore = Math.min(1, uniqueTypes / 6); // 6 types maximum
  
  // Score de lisibilité basé sur la structure
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const avgSentenceLength = sentences.length > 0 
    ? sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length 
    : 0;
  const readabilityScore = Math.max(0, Math.min(1, 1 - (avgSentenceLength - 100) / 200));
  
  // Générer des suggestions
  const suggestions: string[] = [];
  
  if (averageConfidence < 0.5) {
    suggestions.push("Le raisonnement pourrait être plus explicite avec des connecteurs logiques.");
  }
  
  if (uniqueTypes < 3) {
    suggestions.push("Diversifier les types de raisonnement (questions, analyses, étapes).");
  }
  
  if (readabilityScore < 0.6) {
    suggestions.push("Raccourcir les phrases pour améliorer la lisibilité.");
  }
  
  if (!patterns.some(p => p.type === 'conclusion')) {
    suggestions.push("Ajouter une conclusion claire au raisonnement.");
  }
  
  return {
    patterns,
    metrics: {
      totalPatterns,
      averageConfidence,
      dominantType,
      complexityScore,
      readabilityScore
    },
    suggestions
  };
}

/**
 * Nettoie le cache de raisonnement (utilitaire pour la maintenance)
 */
export function clearReasoningCache(): void {
  Object.keys(reasoningCache).forEach(key => {
    delete reasoningCache[key];
  });
}

/**
 * Obtient les statistiques du cache
 */
export function getCacheStats(): {
  size: number;
  totalAccess: number;
  averageAge: number;
  hitRate: number;
} {
  const keys = Object.keys(reasoningCache);
  const now = Date.now();
  
  const totalAccess = keys.reduce((sum, key) => sum + reasoningCache[key].accessCount, 0);
  const averageAge = keys.length > 0 
    ? keys.reduce((sum, key) => sum + (now - reasoningCache[key].timestamp), 0) / keys.length 
    : 0;
  
  // Estimation du hit rate basée sur les accès multiples
  const multipleAccessEntries = keys.filter(key => reasoningCache[key].accessCount > 1).length;
  const hitRate = keys.length > 0 ? multipleAccessEntries / keys.length : 0;
  
  return {
    size: keys.length,
    totalAccess,
    averageAge: averageAge / 1000, // en secondes
    hitRate
  };
}
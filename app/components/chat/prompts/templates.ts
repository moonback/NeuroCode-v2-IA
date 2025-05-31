export interface PromptSection {
  title: string;
  items: string[];
}

export interface PromptTemplate {
  base: string;
  sections: PromptSection[];
  conclusion?: string;
}

export const PROMPT_TEMPLATES = {
  reproduce: {
    base: "Analyse cette interface utilisateur et génère une application React + Vite complète qui la reproduit fidèlement.",
    sections: [
      {
        title: "Instructions spécifiques",
        items: [
          "Reproduis exactement la mise en page, les couleurs, les espacements et les interactions",
          "Utilise TypeScript pour un code robuste",
          "Implémente tous les composants avec une architecture modulaire",
          "Inclus la gestion d'état (useState, useContext si nécessaire)",
          "Ajoute les animations et transitions visibles dans l'interface",
          "Utilise CSS Modules ou Styled Components pour le styling",
          "Assure-toi que l'interface est responsive (mobile, tablet, desktop)",
          "Inclus la gestion des erreurs et des états de chargement"
        ]
      },
      {
        title: "Livrables attendus",
        items: [
          "Structure complète du projet avec tous les fichiers",
          "Code source commenté et organisé",
          "Configuration Vite optimisée",
          "Instructions de déploiement",
          "Liste des dépendances avec versions spécifiques"
        ]
      }
    ]
  },
  explain: {
    base: "Analyse cette interface utilisateur selon une approche design thinking structurée.",
    sections: [
      {
        title: "Architecture de l'Information",
        items: [
          "Organisation et structuration du contenu",
          "Hiérarchie de l'information (primary, secondary, tertiary)",
          "Navigation et wayfinding",
          "Mental models et conventions utilisateur",
          "Card sorting et tree testing principles"
        ]
      },
      {
        title: "Système Visuel",
        items: [
          "Typographie : Hiérarchie, lisibilité, personnalité de marque",
          "Couleurs : Palette, psychologie, contraste, accessibilité",
          "Espacement : Système de grille, breathing room, densité",
          "Iconographie : Style, consistance, compréhension universelle",
          "Imagery : Traitement, cohérence, message véhiculé"
        ]
      },
      {
        title: "Patterns d'Interaction",
        items: [
          "Affordances et signifiers",
          "Feedback loops (micro-interactions)",
          "Progressive disclosure",
          "Error prevention et recovery",
          "Call-to-actions et conversion"
        ]
      },
      {
        title: "Principes UX Appliqués",
        items: [
          "Lois de Fitts et Hick : Optimisation des interactions",
          "Gestalt principles : Proximité, similarité, continuité",
          "Jakob's Law : Conformité aux standards",
          "Aesthetic-Usability Effect : Balance beauté/fonction",
          "Cognitive Load Theory : Simplification mentale"
        ]
      }
    ],
    conclusion: "Pour chaque point analysé, fournir :\n- Observation factuelle\n- Principe design appliqué\n- Impact sur l'expérience utilisateur\n- Benchmarks et références sectorielles\n- Recommandations d'optimisation"
  }
}; 
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { Dialog, DialogRoot, DialogTitle, DialogClose } from '~/components/ui/Dialog';
import { IconButton } from '~/components/ui/IconButton';
import type { Message } from 'ai';
import styles from './UIImageAnalyzer.module.scss';

interface UIImageAnalyzerProps {
  onAnalysisComplete?: (analysisType: string, imageData: string, prompt: string) => void;
  sendMessage?: (event: React.UIEvent, messageInput?: string) => void;
  append?: (message: Message) => void;
  model?: string;
  provider?: { name: string };
  onChatStart?: () => void;
}

type AnalysisType = 'reproduce' | 'improve' | 'explain'| 'convert' | 'optimize' | 'accessibility';

interface AnalysisOption {
  id: AnalysisType;
  title: string;
  description: string;
  icon: string;
  prompt: string;
  gradient: string;
  color: string;
}

const ANALYSIS_OPTIONS: AnalysisOption[] = [
    {
      id: 'reproduce',
      title: 'Reproduire le code',
      description: 'Génère le code pour reproduire cette interface avec précision',
      icon: 'i-ph:code',
      gradient: 'from-violet-500/20 to-cyan-500/20',
      color: 'text-violet-400',
      prompt: `Analyse cette interface utilisateur et génère une application React + Vite complète qui la reproduit fidèlement.
  
  **Instructions spécifiques :**
  - Reproduis exactement la mise en page, les couleurs, les espacements et les interactions
  - Utilise TypeScript pour un code robuste
  - Implémente tous les composants avec une architecture modulaire
  - Inclus la gestion d'état (useState, useContext si nécessaire)
  - Ajoute les animations et transitions visibles dans l'interface
  - Utilise CSS Modules ou Styled Components pour le styling
  - Assure-toi que l'interface est responsive (mobile, tablet, desktop)
  - Inclus la gestion des erreurs et des états de chargement
  - Fournis un fichier README avec les instructions d'installation et de lancement
  - Respecte les bonnes pratiques React (hooks, performance, accessibilité)
  
  **Livrables attendus :**
  1. Structure complète du projet avec tous les fichiers
  2. Code source commenté et organisé
  3. Configuration Vite optimisée
  4. Instructions de déploiement
  5. Liste des dépendances avec versions spécifiques`
    },
    {
      id: 'improve',
      title: 'Améliorer l\'UI',
      description: 'Propose des améliorations concrètes de design et d\'expérience utilisateur',
      icon: 'i-ph:magic-wand',
      gradient: 'from-purple-500/20 to-pink-500/20',
      color: 'text-purple-400',
      prompt: `Effectue une analyse UX/UI approfondie de cette interface et propose des améliorations concrètes.
  
  **Axes d'analyse :**
  
  **1. Accessibilité (WCAG 2.1)**
  - Contraste des couleurs (AA/AAA)
  - Navigation clavier et lecteurs d'écran
  - Taille des zones cliquables (minimum 44px)
  - Alt text et ARIA labels
  - Focus management
  
  **2. Ergonomie et Usabilité**
  - Parcours utilisateur et friction points
  - Charge cognitive et simplicité
  - Consistance des patterns UI
  - Affordances et feedback visuel
  - Performance perçue
  
  **3. Design System et Cohérence**
  - Hiérarchie typographique
  - Système de couleurs et sémantique
  - Espacements et grille
  - Composants réutilisables
  - States et interactions
  
  **4. Responsive et Multi-plateforme**
  - Adaptation mobile/desktop
  - Touch targets et gestures
  - Performance sur différents devices
  - Progressive Web App features
  
  **Pour chaque amélioration proposée :**
  - Identifie le problème spécifique
  - Explique l'impact sur l'utilisateur
  - Propose une solution concrète avec mockup/code
  - Justifie le choix par des principes UX établis
  - Estime la priorité (Critical/High/Medium/Low)`
    },
    {
      id: 'explain',
      title: 'Expliquer le design',
      description: 'Analyse détaillée des choix de design et des principes UX appliqués',
      icon: 'i-ph:lightbulb',
      gradient: 'from-amber-500/20 to-orange-500/20',
      color: 'text-amber-400',
      prompt: `Analyse cette interface utilisateur selon une approche design thinking structurée.
  
  **1. Architecture de l'Information**
  - Organisation et structuration du contenu
  - Hiérarchie de l'information (primary, secondary, tertiary)
  - Navigation et wayfinding
  - Mental models et conventions utilisateur
  - Card sorting et tree testing principles
  
  **2. Système Visuel**
  - **Typographie :** Hiérarchie, lisibilité, personnalité de marque
  - **Couleurs :** Palette, psychologie, contraste, accessibilité
  - **Espacement :** Système de grille, breathing room, densité
  - **Iconographie :** Style, consistance, compréhension universelle
  - **Imagery :** Traitement, cohérence, message véhiculé
  
  **3. Patterns d'Interaction**
  - Affordances et signifiers
  - Feedback loops (micro-interactions)
  - Progressive disclosure
  - Error prevention et recovery
  - Call-to-actions et conversion
  
  **4. Principes UX Appliqués**
  - **Lois de Fitts et Hick :** Optimisation des interactions
  - **Gestalt principles :** Proximité, similarité, continuité
  - **Jakob's Law :** Conformité aux standards
  - **Aesthetic-Usability Effect :** Balance beauté/fonction
  - **Cognitive Load Theory :** Simplification mentale
  
  **5. Context d'Usage**
  - Personas et use cases
  - Environment d'utilisation
  - Device et platform considerations
  - Accessibility requirements
  - Business objectives alignment
  
  **Fournis pour chaque point :**
  - Observation factuelle
  - Principe design appliqué
  - Impact sur l'expérience utilisateur
  - Benchmarks et références sectorielles
  - Recommandations d'optimisation`
    },
    {
      id: 'convert',
      title: 'Convertir technologie',
      description: 'Adapte le code vers d\'autres frameworks ou technologies',
      icon: 'i-ph:arrow-square-out',
      gradient: 'from-emerald-500/20 to-teal-500/20',
      color: 'text-emerald-400',
      prompt: `Analyse cette interface et propose des adaptations vers différentes technologies.
  
  **Options de conversion disponibles :**
  
  **1. Frameworks Frontend**
  - Vue.js 3 (Composition API + TypeScript)
  - Angular 17+ (Standalone components)
  - Svelte/SvelteKit
  - Next.js (App Router + Server Components)
  - Nuxt 3 (Vue ecosystem)
  - Solid.js (Fine-grained reactivity)
  
  **2. Frameworks CSS**
  - Tailwind CSS (Utility-first)
  - Bootstrap 5 (Component-based)
  - Bulma (Modern CSS framework)
  - Chakra UI / Mantine (Component libraries)
  
  **3. Technologies Natives**
  - React Native (iOS/Android)
  - Flutter (Dart)
  - Tauri (Rust + Web)
  - Electron (Desktop)
  
  **4. Alternatives No-Code/Low-Code**
  - Webflow (Visual development)
  - Framer (Interactive prototyping)
  - Bubble (Full-stack no-code)
  
  **Pour chaque conversion :**
  - Identifie les équivalences de composants
  - Adapte les patterns spécifiques au framework
  - Optimise selon les bonnes pratiques de la technologie cible
  - Conserve l'expérience utilisateur originale
  - Fournis le code complet avec configuration
  - Explique les avantages/inconvénients de chaque approche
  - Inclus les instructions de migration et déploiement
  
  **Choisis la technologie cible ou demande-moi de toutes les couvrir.**`
    },
    {
      id: 'optimize',
      title: 'Optimiser performance',
      description: 'Analyse et améliore les performances techniques et UX',
      icon: 'i-ph:rocket-launch',
      gradient: 'from-red-500/20 to-orange-500/20',
      color: 'text-red-400',
      prompt: `Effectue un audit de performance complet de cette interface et propose des optimisations.
  
  **1. Performance Technique**
  
  **Core Web Vitals :**
  - **LCP (Largest Contentful Paint) :** < 2.5s
  - **FID (First Input Delay) :** < 100ms  
  - **CLS (Cumulative Layout Shift) :** < 0.1
  - **INP (Interaction to Next Paint) :** < 200ms
  
  **Optimisations Frontend :**
  - Bundle analysis et code splitting
  - Lazy loading des composants/images
  - Tree shaking et dead code elimination
  - Critical CSS et resource hints
  - Service Workers et caching strategies
  - Image optimization (WebP, AVIF, responsive)
  
  **2. Performance UX**
  
  **Perceived Performance :**
  - Loading states et skeleton screens
  - Progressive enhancement
  - Optimistic UI updates
  - Micro-interactions et feedback immédiat
  - Error boundaries et graceful degradation
  
  **3. Optimisations Spécifiques**
  
  **React Performance :**
  - Memo, useMemo, useCallback optimization
  - Virtual scrolling pour les listes
  - Concurrent features (React 18+)
  - Code splitting avec Suspense
  - State management optimization
  
  **CSS Performance :**
  - Critical CSS inlining
  - CSS containment
  - Efficient selectors
  - Animation optimization (transform, opacity)
  - CSS-in-JS optimization
  
  **4. Monitoring et Métriques**
  - Real User Monitoring (RUM)
  - Synthetic testing setup
  - Performance budgets
  - Lighthouse CI integration
  - Error tracking et analytics
  
  **Livrables :**
  - Audit détaillé avec métriques actuelles
  - Recommandations priorisées par impact
  - Code optimisé avec before/after
  - Configuration d'outils de monitoring
  - Roadmap d'implémentation`
    },
    {
      id: 'accessibility',
      title: 'Audit accessibilité',
      description: 'Évaluation complète WCAG et recommandations d\'amélioration',
      icon: 'i-ph:heart',
      gradient: 'from-blue-500/20 to-indigo-500/20',
      color: 'text-blue-400',
      prompt: `Effectue un audit d'accessibilité exhaustif selon les standards WCAG 2.1 AA/AAA.
  
  **1. Évaluation WCAG 2.1**
  
  **Perceivable (Perceptible) :**
  - Contraste des couleurs (4.5:1 AA, 7:1 AAA)
  - Alternatives textuelles pour images/médias
  - Sous-titres et transcriptions
  - Adaptabilité aux technologies d'assistance
  - Distinguabilité visuelle et auditive
  
  **Operable (Utilisable) :**
  - Navigation clavier complète (Tab, Enter, Espace, flèches)
  - Pas de contenu provoquant des crises (flashs)
  - Temps suffisant pour les interactions
  - Navigation cohérente et prévisible
  - Zones de clic suffisantes (44x44px minimum)
  
  **Understandable (Compréhensible) :**
  - Langue du contenu définie
  - Texte lisible et compréhensible
  - Fonctionnalité prévisible
  - Assistance à la saisie et gestion d'erreurs
  
  **Robust (Robuste) :**
  - Compatibilité avec technologies d'assistance
  - HTML sémantique valide
  - ARIA labels et roles appropriés
  - Support multi-navigateurs et devices
  
  **2. Tests Pratiques**
  
  **Navigation clavier :**
  - Tab order logique
  - Focus visible et cohérent
  - Skip links et landmarks
  - Trap focus dans les modals
  - Keyboard shortcuts
  
  **Lecteurs d'écran :**
  - NVDA, JAWS, VoiceOver compatibility
  - Headings structure (h1-h6)
  - Lists et tables semantics
  - Form labels et descriptions
  - Live regions pour les updates
  
  **3. Outils et Testing**
  - axe-core automated testing
  - Manual testing checklist
  - Screen reader testing guide
  - Color blindness simulation
  - Accessibility audit tools integration
  
  **Livrables :**
  - Score WCAG détaillé par critère
  - Liste des violations avec priorité
  - Code corrigé avec ARIA patterns
  - Guide de test manuel
  - Recommandations d'outils et workflow`
    }
  ];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export const UIImageAnalyzer: React.FC<UIImageAnalyzerProps> = ({
  onAnalysisComplete,
  sendMessage,
  append,
  model,
  provider,
  onChatStart
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): boolean => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Type de fichier non supporté. Veuillez sélectionner une image (JPEG, PNG, GIF, WebP).');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Fichier trop volumineux. La taille maximale est de 10MB.');
      return false;
    }

    return true;
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result && result.startsWith('data:image/')) {
        setImagePreview(result);
        setCurrentStep(2);
      } else {
        toast.error('Erreur lors du chargement de l\'image.');
        setSelectedFile(null);
      }
    };
    reader.onerror = () => {
      toast.error('Erreur lors de la lecture du fichier.');
      setSelectedFile(null);
    };
    reader.readAsDataURL(file);
  }, [validateFile]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => ACCEPTED_IMAGE_TYPES.includes(file.type));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    } else {
      toast.error('Aucune image valide trouvée dans les fichiers déposés.');
    }
  }, [handleFileSelect]);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile || !selectedAnalysis || !imagePreview) {
      toast.error('Veuillez sélectionner une image et un type d\'analyse.');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const analysisOption = ANALYSIS_OPTIONS.find(option => option.id === selectedAnalysis);
      if (!analysisOption) return;

      if (append) {
        console.log('UIImageAnalyzer: Envoi du message avec append');
        
        const message: Message = {
          id: `ui-analyzer-${Date.now()}`,
          role: 'user',
          content: [
            {
              type: 'text',
              text: `[Model: ${model || 'Unknown'}]\n\n[Provider: ${provider?.name || 'Unknown'}]\n\n${analysisOption.prompt}`
            },
            {
              type: 'image',
              image: imagePreview
            }
          ] as any
        } as Message;
        
        append(message);
        
        if (onChatStart) {
          onChatStart();
        }
      } else if (sendMessage) {
        const setUploadedFiles = (window as any).__BOLT_SET_UPLOADED_FILES__;
        const setImageDataList = (window as any).__BOLT_SET_IMAGE_DATA_LIST__;
        const currentFiles = (window as any).__BOLT_UPLOADED_FILES__ || [];
        const currentImageData = (window as any).__BOLT_IMAGE_DATA_LIST__ || [];

        if (setUploadedFiles && setImageDataList) {
          setUploadedFiles([...currentFiles, selectedFile]);
          setImageDataList([...currentImageData, imagePreview]);
        }
        
        const event = new Event('click') as any;
        sendMessage(event, `[Model: ${model || 'Unknown'}]\n\n[Provider: ${provider?.name || 'Unknown'}]\n\n${analysisOption.prompt}`);
      }

      onAnalysisComplete?.(selectedAnalysis, imagePreview, analysisOption.prompt);

      toast.success(`Analyse "${analysisOption.title}" lancée avec succès!`);
      
      setIsOpen(false);
      resetState();
      
    } catch (error) {
      console.error('Erreur lors de l\'analyse:', error);
      toast.error('Erreur lors du lancement de l\'analyse.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile, selectedAnalysis, imagePreview, onAnalysisComplete, sendMessage, append, model, provider, onChatStart]);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setSelectedAnalysis(null);
    setImagePreview(null);
    setIsDragOver(false);
    setIsAnalyzing(false);
    setCurrentStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    resetState();
  }, [resetState]);

  const handleBackToStep1 = useCallback(() => {
    setSelectedAnalysis(null);
    setCurrentStep(1);
  }, []);

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <IconButton
          title="Analyser une image UI"
          onClick={() => setIsOpen(true)}
          className="relative transition-all duration-300 hover:bg-gradient-to-r hover:from-violet-500/15 hover:via-purple-500/15 hover:to-pink-500/15 border border-transparent hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/25"
        >
          <div className="i-ph:image text-xl" />
          <motion.div
            className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-400/20 via-purple-400/20 to-pink-400/20 opacity-0 blur-sm"
            whileHover={{ 
              opacity: 1,
              scale: 1.1
            }}
            transition={{ 
              duration: 0.3,
              ease: "easeOut"
            }}
          />
          <motion.div 
            className="absolute -inset-1 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-lg opacity-0 blur-xl"
            whileHover={{
              opacity: 0.2,
              scale: 1.2
            }}
            transition={{
              duration: 0.4,
              ease: "easeOut" 
            }}
          />
        </IconButton>
      </motion.div>

      <DialogRoot open={isOpen} onOpenChange={setIsOpen}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Dialog className="max-w-3xl p-0 overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl">
                {/* Header avec gradient */}
                <div className="relative p-6 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-pink-600/20 border-b border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                        Analyser une interface utilisateur
                      </DialogTitle>
                      <p className="text-sm text-slate-400 mt-1">
                        Uploadez une image et choisissez votre type d'analyse
                      </p>
                    </div>
                    <DialogClose asChild>
                      {/* <motion.button
                        onClick={handleClose}
                        className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <div className="i-ph:x text-xl" />
                      </motion.button> */}
                    </DialogClose>
                  </div>

                  {/* Progress indicator */}
                  <div className="flex items-center gap-3 mt-6">
                    <div className="flex items-center gap-2">
                      <motion.div
                        className={classNames(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                          currentStep >= 1 ? 'bg-violet-500 text-white' : 'bg-slate-700 text-slate-400'
                        )}
                        animate={{ scale: currentStep === 1 ? 1.1 : 1 }}
                      >
                        1
                      </motion.div>
                      <span className={classNames('text-sm font-medium', currentStep >= 1 ? 'text-violet-400' : 'text-slate-500')}>
                        Image
                      </span>
                    </div>
                    
                    <div className={classNames('flex-1 h-0.5 rounded-full transition-all', selectedFile ? 'bg-violet-500' : 'bg-slate-700')} />
                    
                    <div className="flex items-center gap-2">
                      <motion.div
                        className={classNames(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                          currentStep >= 2 ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-400'
                        )}
                        animate={{ scale: currentStep === 2 ? 1.1 : 1 }}
                      >
                        2
                      </motion.div>
                      <span className={classNames('text-sm font-medium', currentStep >= 2 ? 'text-purple-400' : 'text-slate-500')}>
                        Analyse
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-8">
                  {/* Étape 1: Upload d'image */}
                  <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                          <div className="i-ph:upload text-violet-400" />
                          Sélectionner une image
                        </h3>
                        
                        {!selectedFile ? (
                          <motion.div
                            className={classNames(
                              'relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer group overflow-hidden',
                              {
                                'border-slate-600 hover:border-violet-400': !isDragOver,
                                'border-violet-400 bg-violet-500/10': isDragOver
                              }
                            )}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {/* Background gradient effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <motion.div
                              className="relative z-10"
                              animate={{ y: isDragOver ? -5 : 0 }}
                            >
                              <div className="i-ph:cloud-arrow-up text-6xl text-violet-400 mb-6 mx-auto" />
                              <p className="text-white font-semibold text-lg mb-3">
                                Glissez-déposez une image ou cliquez pour sélectionner
                              </p>
                              <p className="text-slate-400 text-sm mb-6">
                                Formats supportés: JPEG, PNG, GIF, WebP (max 10MB)
                              </p>
                              
                              <motion.div
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-medium shadow-lg"
                                whileHover={{ scale: 1.05 }}
                              >
                                <div className="i-ph:folder-open" />
                                Parcourir les fichiers
                              </motion.div>
                            </motion.div>
                            
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept={ACCEPTED_IMAGE_TYPES.join(',')}
                              onChange={handleFileInputChange}
                              className="hidden"
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            <div className="relative group">
                              {imagePreview && (
                                <img
                                  src={imagePreview}
                                  alt="Aperçu de l'image sélectionnée"
                                  className="w-full max-h-80 object-contain rounded-xl border border-slate-700 shadow-lg"
                                  onError={() => {
                                    toast.error('Erreur lors de l\'affichage de l\'image.');
                                    setImagePreview(null);
                                    setSelectedFile(null);
                                    setCurrentStep(1);
                                  }}
                                />
                              )}
                              <motion.button
                                onClick={() => {
                                  setSelectedFile(null);
                                  setImagePreview(null);
                                  setCurrentStep(1);
                                }}
                                className="absolute top-3 right-3 p-2 bg-red-500/90 backdrop-blur text-white rounded-full hover:bg-red-600 transition-all shadow-lg opacity-0 group-hover:opacity-100"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <div className="i-ph:trash text-sm" />
                              </motion.button>
                            </div>
                            
                            <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                              <div className="i-ph:file-image text-2xl text-violet-400" />
                              <div className="flex-1">
                                <p className="text-white font-medium">{selectedFile.name}</p>
                                <p className="text-slate-400 text-sm">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                              <div className="i-ph:check-circle-fill text-2xl text-green-400" />
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Étape 2: Choix du type d'analyse */}
                    {currentStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                            <div className="i-ph:magic-wand text-violet-400" />
                            Choisir le type d'analyse
                          </h3>
                          <motion.button
                            onClick={handleBackToStep1}
                            className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white transition-colors rounded-lg border border-slate-600 hover:bg-slate-700"
                            whileHover={{ x: -2 }}
                          >
                            <div className="i-ph:arrow-left" />
                            <span className="text-sm">Modifier l'image</span>
                          </motion.button>
                        </div>
                        
                        <div className="grid gap-4">
                          {ANALYSIS_OPTIONS.map((option, index) => (
                            <motion.button
                              key={option.id}
                              onClick={() => setSelectedAnalysis(option.id)}
                              className={classNames(
                                'relative p-4 rounded-lg border text-left transition-all overflow-hidden group',
                                selectedAnalysis === option.id
                                  ? 'border-violet-400 bg-violet-500/10 shadow-lg'
                                  : 'bg-slate-500/50 border-slate-600 hover:border-violet-400 hover:bg-slate-700/50'
                              )}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="relative z-10 flex items-start gap-3">
                                <motion.div 
                                  className={classNames(
                                    option.icon,
                                    'text-xl transition-all duration-300',
                                    selectedAnalysis === option.id 
                                      ? 'text-violet-400 scale-110' 
                                      : 'text-slate-400 group-hover:text-violet-400'
                                  )}
                                  whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                                  transition={{ duration: 0.4 }}
                                />
                                
                                <div className="flex-1 space-y-1">
                                  <h4 className={classNames(
                                    'text-base font-semibold transition-colors duration-300',
                                    selectedAnalysis === option.id
                                      ? 'text-violet-400'
                                      : 'text-white'
                                  )}>
                                    {option.title}
                                  </h4>
                                  <p className={classNames(
                                    'text-sm leading-relaxed transition-colors duration-300',
                                    selectedAnalysis === option.id
                                      ? 'text-slate-300'
                                      : 'text-slate-400 group-hover:text-slate-300'
                                  )}>
                                    {option.description}
                                  </p>
                                </div>

                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ 
                                    scale: selectedAnalysis === option.id ? 1 : 0,
                                    opacity: selectedAnalysis === option.id ? 1 : 0
                                  }}
                                  className="flex items-center justify-center w-5 h-5 rounded-full bg-violet-500"
                                >
                                  <div className="i-ph:check text-white text-sm" />
                                </motion.div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer avec boutons */}
                <div className="p-6 bg-slate-800/50 border-t border-slate-700">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-slate-400">
                      {currentStep === 1 && "Étape 1 sur 2 - Sélectionnez votre image"}
                      {currentStep === 2 && "Étape 2 sur 2 - Choisissez votre analyse"}
                    </div>
                    
                    <div className="flex gap-3">
                      <motion.button
                        onClick={handleClose}
                        className="px-6 bg-slate-800/50 py-2 text-slate-400 hover:text-white transition-colors rounded-lg border border-slate-600 hover:bg-slate-700"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Annuler
                      </motion.button>
                      
                      <motion.button
                        onClick={handleAnalyze}
                        disabled={!selectedFile || !selectedAnalysis || isAnalyzing}
                        className={classNames(
                          'px-8 py-3 rounded-lg font-semibold transition-all flex items-center gap-2',
                          {
                            'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border border-violet-400': Boolean(selectedFile && selectedAnalysis && !isAnalyzing),
                            'bg-slate-700 text-slate-400 cursor-not-allowed border border-slate-600': !selectedFile || !selectedAnalysis || isAnalyzing
                          }
                        )}
                        whileHover={selectedFile && selectedAnalysis && !isAnalyzing ? { scale: 1.02 } : {}}
                        whileTap={selectedFile && selectedAnalysis && !isAnalyzing ? { scale: 0.98 } : {}}
                      >
                        {isAnalyzing ? (
                          <>
                            <motion.div
                              className="i-ph:spinner-gap"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            Analyse en cours...
                          </>
                        ) : (
                          <>
                            <div className="i-ph:rocket-launch" />
                            Lancer l'analyse
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </Dialog>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogRoot>
    </>
  );
};
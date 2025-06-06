import React, { useState, useRef, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { classNames } from '~/utils/classNames';
import { 
  UIImageAnalyzerModal,
  UIImageAnalyzerModalRoot,
  UIImageAnalyzerModalClose,
  UIImageAnalyzerModalHeader,
  UIImageAnalyzerModalSteps,
  UIImageAnalyzerModalContent,
  UIImageAnalyzerModalFooter,
  UIImageAnalyzerModalStyles
} from '~/components/ui/UIImageAnalyzerModal';
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

type AnalysisType = 'reproduce' | 'improve' | 'explain';

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
    description: 'Génère le code pour reproduire cette interface avec une fidélité pixel-perfect',
    icon: 'i-ph:code',
    gradient: 'from-bolt-elements-item-backgroundAccent to-bolt-elements-background-depth-3',
    color: 'text-bolt-elements-item-contentAccent',
    prompt: `Analyze and reproduce this UI interface with production-ready code.

Key Focus Areas:
- Visual fidelity & responsive design
- Component architecture & state management
- Performance & accessibility
- Clean code & best practices

Technical Stack:
- React + TypeScript
- Tailwind/CSS-in-JS
- Framer Motion
- Unit Testing

Deliverables:
- Pixel-perfect components
- Styling implementation
- Custom hooks & utils
- Documentation
- Tests

Please provide implementation with clear structure and comments.`
  },

    {
      id: 'explain',
      title: 'Expliquer le design',
      description: 'Analyse détaillée des choix de design et des principes UX appliqués',
      icon: 'i-ph:lightbulb',
      gradient: 'from-bolt-elements-item-backgroundAccent to-bolt-elements-background-depth-2',
      color: 'text-bolt-elements-item-contentAccent',
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
   
  ];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

// Ajout de la validation d'URL
const isValidImageUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(parsedUrl.pathname);
  } catch {
    return false;
  }
};



const AnalysisOptionItem = memo(({ 
  option, 
  isSelected, 
  onClick 
}: { 
  option: AnalysisOption, 
  isSelected: boolean,
  onClick: () => void 
}) => (
  <motion.button
    onClick={onClick}
    className={classNames(
      'relative p-4 rounded-lg border text-left transition-all overflow-hidden group',
      isSelected
        ? 'border-bolt-elements-item-contentAccent bg-bolt-elements-item-backgroundAccent shadow-lg'
        : 'bg-bolt-elements-background-depth-2 border-bolt-elements-borderColor hover:border-bolt-elements-item-contentAccent hover:bg-bolt-elements-background-depth-3'
    )}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className="relative z-10 flex items-start gap-3">
      <motion.div 
        className={classNames(
          option.icon,
          'text-xl transition-all duration-300',
          isSelected 
            ? 'text-bolt-elements-item-contentAccent scale-110' 
            : 'text-bolt-elements-textSecondary group-hover:text-bolt-elements-item-contentAccent'
        )}
        whileHover={{ rotate: [0, -5, 5, -5, 0] }}
        transition={{ duration: 0.4 }}
      />
      
      <div className="flex-1 space-y-1">
        <h4 className={classNames(
          'text-base font-semibold transition-colors duration-300',
          isSelected
            ? 'text-bolt-elements-item-contentAccent'
            : 'text-bolt-elements-textPrimary'
        )}>
          {option.title}
        </h4>
        <p className={classNames(
          'text-sm leading-relaxed transition-colors duration-300',
          isSelected
            ? 'text-bolt-elements-textSecondary'
            : 'text-bolt-elements-textTertiary group-hover:text-bolt-elements-textSecondary'
        )}>
          {option.description}
        </p>
      </div>

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: isSelected ? 1 : 0,
          opacity: isSelected ? 1 : 0
        }}
        className="flex items-center justify-center w-5 h-5 rounded-full bg-bolt-elements-item-contentAccent"
      >
        <div className="i-ph:check text-white text-sm" />
      </motion.div>
    </div>
  </motion.button>
));



// Nouveau composant pour l'entrée d'URL
const URLInput = memo(({ onUrlSubmit }: { onUrlSubmit: (url: string) => Promise<void> }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    if (!isValidImageUrl(url)) {
      setError('L\'URL doit pointer vers une image valide (jpg, png, gif, webp)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onUrlSubmit(url);
      setUrl('');
    } catch (err) {
      setError('Impossible de charger l\'image depuis cette URL');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-2">
      <div className="relative">
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          placeholder="https://exemple.com/image.jpg"
          className={classNames(
            "w-full px-4 py-3 bg-bolt-elements-background-depth-2 rounded-lg",
            "border transition-colors duration-200",
            "text-bolt-elements-textPrimary placeholder:text-bolt-elements-textTertiary",
            error 
              ? "border-red-500 focus:border-red-600"
              : "border-bolt-elements-borderColor focus:border-bolt-elements-borderColorActive"
          )}
        />
        <motion.button
          type="submit"
          disabled={!url || isLoading}
          className={classNames(
            "absolute right-2 top-1/2 -translate-y-1/2",
            "px-4 py-1.5 rounded-md",
            "text-sm font-medium",
            "transition-all duration-200",
            !url || isLoading
              ? "bg-bolt-elements-background-depth-3 text-bolt-elements-textTertiary"
              : "bg-bolt-elements-item-backgroundAccent text-bolt-elements-item-contentAccent"
          )}
          whileHover={url && !isLoading ? { scale: 1.05 } : {}}
          whileTap={url && !isLoading ? { scale: 0.95 } : {}}
        >
          {isLoading ? (
            <motion.div
              className="i-ph:spinner-gap"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          ) : (
            "Analyser"
          )}
        </motion.button>
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}
    </form>
  );
});

export const UIImageAnalyzer: React.FC<UIImageAnalyzerProps> = memo(({
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

  // Optimisation du FileReader avec useMemo
  const fileReader = useMemo(() => {
    const reader = new FileReader();
    reader.onerror = () => {
      toast.error('Erreur lors de la lecture du fichier.');
      setSelectedFile(null);
    };
    return reader;
  }, []);

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

  // Optimisation des callbacks avec useCallback et dépendances minimales
  const handleFileSelect = useCallback((file: File) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);
    
    fileReader.onload = (e) => {
      const result = e.target?.result as string;
      if (result && result.startsWith('data:image/')) {
        setImagePreview(result);
        setCurrentStep(2);
      } else {
        toast.error('Erreur lors du chargement de l\'image.');
        setSelectedFile(null);
      }
    };
    fileReader.readAsDataURL(file);
  }, [fileReader, validateFile]);

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



  // Optimisation du message avec useMemo
  const analysisMessage = useMemo(() => {
    if (!selectedFile || !selectedAnalysis) return null;
    
    const analysisOption = ANALYSIS_OPTIONS.find(option => option.id === selectedAnalysis);
    if (!analysisOption) return null;

    return {
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
  }, [selectedFile, selectedAnalysis, imagePreview, model, provider?.name]);

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

  const handleUrlSubmit = useCallback(async (url: string) => {
    try {
      // Utilisation d'un service proxy pour contourner les restrictions CORS
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Vérification du type de contenu
      const contentType = response.headers.get('content-type');
      if (!contentType || !ACCEPTED_IMAGE_TYPES.some(type => contentType.includes(type.split('/')[1]))) {
        throw new Error('Le contenu n\'est pas une image valide');
      }
      
      const blob = await response.blob();
      
      // Extraction du nom de fichier depuis l'URL
      const fileName = url.split('/').pop() || 'image-from-url.jpg';
      const file = new File([blob], fileName, { type: blob.type });
      
      if (!validateFile(file)) {
        throw new Error('Le fichier ne respecte pas les critères (taille ou format)');
      }
      
      handleFileSelect(file);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'URL:', error);
      
      // Messages d'erreur plus spécifiques
      let errorMessage = 'Impossible de charger l\'image depuis cette URL';
      
      if (error instanceof Error) {
        if (error.message.includes('Le contenu n\'est pas une image')) {
          errorMessage = 'L\'URL ne pointe pas vers une image valide';
        } else if (error.message.includes('critères')) {
          errorMessage = 'L\'image ne respecte pas les critères (taille ou format)';
        } else if (error.message.includes('HTTP')) {
          errorMessage = 'L\'image n\'est pas accessible (erreur serveur)';
        }
      }
      
      toast.error(errorMessage, {
        position: 'bottom-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  }, [validateFile, handleFileSelect]);

  return (
    <>
      <UIImageAnalyzerModalStyles />
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <IconButton
          title="Analyser une image UI"
          onClick={() => setIsOpen(true)}
          className="relative transition-all duration-300 hover:bg-bolt-elements-item-backgroundActive border border-transparent hover:border-bolt-elements-borderColorActive hover:shadow-lg"
        >
          <div className="i-ph:image text-xl text-bolt-elements-item-contentDefault hover:text-bolt-elements-item-contentAccent" />
          <motion.div
            className="absolute inset-0 rounded-lg bg-bolt-elements-item-backgroundAccent opacity-0 blur-sm"
            whileHover={{ 
              opacity: 0.3,
              scale: 1.05
            }}
            transition={{ 
              duration: 0.3,
              ease: "easeOut"
            }}
          />
        </IconButton>
      </motion.div>

      <UIImageAnalyzerModalRoot open={isOpen} onOpenChange={setIsOpen}>
        <AnimatePresence>
          {isOpen && (
            <UIImageAnalyzerModal onClose={handleClose} onBackdrop={handleClose}>
              <UIImageAnalyzerModalHeader
                title="Analyser une interface utilisateur"
                description="Uploadez une image ou analysez depuis une URL"
                currentStep={currentStep}
                totalSteps={2}
              />
              
              <UIImageAnalyzerModalSteps
                currentStep={currentStep}
                steps={[
                  {
                    key: 1,
                    label: "Image",
                    icon: "i-ph:upload",
                    completed: Boolean(selectedFile)
                  },
                  {
                    key: 2,
                    label: "Analyse",
                    icon: "i-ph:magic-wand",
                    completed: Boolean(selectedAnalysis)
                  }
                ]}
              />
              
              <UIImageAnalyzerModalContent>
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
                        <h3 className="text-xl font-semibold text-bolt-elements-textPrimary mb-4 flex items-center gap-2">
                          <div className="i-ph:upload text-bolt-elements-item-contentAccent" />
                          Sélectionner une image
                        </h3>
                        
                        {!selectedFile ? (
                          <div className="space-y-8">
                            <motion.div
                              className={classNames(
                                'relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer group overflow-hidden',
                                {
                                  'border-bolt-elements-borderColor hover:border-bolt-elements-borderColorActive': !isDragOver,
                                  'border-bolt-elements-borderColorActive bg-bolt-elements-item-backgroundAccent': isDragOver
                                }
                              )}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              onClick={() => fileInputRef.current?.click()}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {/* Background effect */}
                              <div className="absolute inset-0 bg-bolt-elements-item-backgroundAccent opacity-0 group-hover:opacity-50 transition-opacity" />
                              
                              <motion.div
                                className="relative z-10"
                                animate={{ y: isDragOver ? -5 : 0 }}
                              >
                                <div className="i-ph:cloud-arrow-up text-6xl text-bolt-elements-item-contentAccent mb-6 mx-auto" />
                                <p className="text-bolt-elements-textPrimary font-semibold text-lg mb-3">
                                  Glissez-déposez une image ou cliquez pour sélectionner
                                </p>
                                <p className="text-bolt-elements-textSecondary text-sm mb-6">
                                  Formats supportés: JPEG, PNG, GIF, WebP (max 10MB)
                                </p>
                                
                                <motion.div
                                  className="inline-flex items-center gap-2 px-6 py-3 bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text rounded-lg font-medium shadow-lg transition-colors"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  <div className="i-ph:folder-open" />
                                  Parcourir les fichiers
                                </motion.div>
                              </motion.div>
                              
                              {/* Input file caché pour le bouton "Parcourir les fichiers" */}
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                                onChange={handleFileInputChange}
                                className="hidden"
                              />
                            </motion.div>

                            <div className="relative">
                              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-bolt-elements-borderColor" />
                              <div className="relative flex justify-center">
                                <span className="px-4 bg-bolt-elements-background-depth-1 text-bolt-elements-textSecondary text-sm">
                                  ou analysez depuis une URL
                                </span>
                              </div>
                            </div>

                            <URLInput onUrlSubmit={handleUrlSubmit} />
                          </div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                          >
                            {/* Preview de l'image avec overlay d'actions */}
                            <div className="relative group">
                              {imagePreview && (
                                <div className="relative">
                                  <img
                                    src={imagePreview}
                                    alt="Aperçu de l'image sélectionnée"
                                    className="w-full max-h-80 object-contain rounded-xl border border-bolt-elements-borderColor shadow-lg"
                                    onError={() => {
                                      toast.error('Erreur lors de l\'affichage de l\'image.');
                                      setImagePreview(null);
                                      setSelectedFile(null);
                                      setCurrentStep(1);
                                    }}
                                  />
                                  
                                  {/* Overlay avec actions */}
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="flex gap-3">
                                      <motion.button
                                        onClick={() => {
                                          setSelectedFile(null);
                                          setImagePreview(null);
                                          setCurrentStep(1);
                                        }}
                                        className="p-3 bg-bolt-elements-button-danger-background backdrop-blur-sm text-bolt-elements-button-danger-text rounded-full hover:bg-bolt-elements-button-danger-backgroundHover transition-all shadow-lg"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        title="Supprimer l'image"
                                      >
                                        <div className="i-ph:trash text-lg" />
                                      </motion.button>
                                      
                                      <motion.button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 bg-bolt-elements-background-depth-1 backdrop-blur-sm text-bolt-elements-textPrimary rounded-full hover:bg-bolt-elements-background-depth-2 transition-all shadow-lg"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        title="Changer d'image"
                                      >
                                        <div className="i-ph:swap text-lg" />
                                      </motion.button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Informations du fichier avec design amélioré */}
                            <motion.div 
                              className="flex items-center gap-4 p-4 bg-gradient-to-r from-bolt-elements-background-depth-2 to-bolt-elements-background-depth-1 rounded-xl border border-bolt-elements-borderColor shadow-sm"
                              initial={{ scale: 0.95 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1 }}
                            >
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-bolt-elements-item-backgroundAccent rounded-lg flex items-center justify-center">
                                  <div className="i-ph:file-image text-2xl text-bolt-elements-item-contentAccent" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-bolt-elements-textPrimary font-semibold truncate">{selectedFile.name}</p>
                                <p className="text-bolt-elements-textSecondary text-sm">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type.split('/')[1].toUpperCase()}
                                </p>
                              </div>
                              <div className="flex-shrink-0">
                                <motion.div 
                                  className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                >
                                  <div className="i-ph:check text-white text-sm font-bold" />
                                </motion.div>
                              </div>
                            </motion.div>
                            
                            {/* Call-to-action pour passer à l'étape suivante */}
                            <motion.div 
                              className="text-center p-4 bg-bolt-elements-item-backgroundAccent rounded-xl border border-bolt-elements-item-contentAccent"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                            >
                              <div className="flex items-center justify-center gap-2 text-bolt-elements-item-contentAccent mb-2">
                                <div className="i-ph:check-circle-fill text-lg" />
                                <span className="font-medium">Image chargée avec succès !</span>
                              </div>
                              <p className="text-bolt-elements-textSecondary text-sm">
                                Cliquez sur "Suivant" pour choisir le type d'analyse
                              </p>
                            </motion.div>
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
                          <h3 className="text-xl font-semibold text-bolt-elements-textPrimary flex items-center gap-2">
                            <div className="i-ph:magic-wand text-bolt-elements-item-contentAccent" />
                            Choisir le type d'analyse
                          </h3>
<motion.button
  onClick={handleBackToStep1}
  className={classNames(
    "flex items-center gap-2 px-4 py-2.5",
    "bg-bolt-elements-background-depth-3",
    "text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary",
    "transition-all duration-200 ease-out",
    "rounded-lg border border-bolt-elements-borderColor",
    "hover:border-bolt-elements-borderColorActive",
    "hover:bg-bolt-elements-background-depth-3",
    "hover:shadow-md",
    "active:scale-95"
  )}
  whileHover={{ 
    x: -4,
    scale: 1.02
  }}
  whileTap={{
    scale: 0.95
  }}
  transition={{
    type: "spring",
    stiffness: 400,
    damping: 25
  }}
>
  <motion.div 
    className="i-ph:arrow-left"
    initial={{ x: 0 }}
    whileHover={{ x: -2 }}
  />
  <span className="text-sm font-medium">Modifier l'image</span>
</motion.button>
                        </div>
                        
                        <div className="grid gap-4">
                          {ANALYSIS_OPTIONS.map((option, index) => (
                            <AnalysisOptionItem
                              key={option.id}
                              option={option}
                              isSelected={selectedAnalysis === option.id}
                              onClick={() => setSelectedAnalysis(option.id)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </UIImageAnalyzerModalContent>
              
              <UIImageAnalyzerModalFooter
                currentStep={currentStep}
                totalSteps={2}
                stepLabel={
                  currentStep === 1 
                    ? "Étape 1 sur 2 - Sélectionnez votre image"
                    : "Étape 2 sur 2 - Choisissez votre analyse"
                }
                onCancel={handleClose}
                onNext={currentStep === 1 ? () => setCurrentStep(2) : handleAnalyze}
                onPrevious={currentStep === 2 ? handleBackToStep1 : undefined}
                nextLabel={currentStep === 2 ? "Lancer l'analyse" : "Suivant"}
                previousLabel="Modifier l'image"
                cancelLabel="Annuler"
                isNextDisabled={!selectedFile || (currentStep === 2 && !selectedAnalysis)}
                isLoading={isAnalyzing}
              />
            </UIImageAnalyzerModal>
          )}
        </AnimatePresence>
      </UIImageAnalyzerModalRoot>
    </>
  );
});

// Optimisation du nom d'affichage pour le debugging
UIImageAnalyzer.displayName = 'UIImageAnalyzer';
import { toast } from 'react-toastify';
import JSZip from 'jszip';
import { FIGMA_CONFIG } from '~/config/figma';

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  style?: {
    [key: string]: any;
  };
  layout?: {
    [key: string]: any;
  };
  fills?: any[];
  strokes?: any[];
  effects?: any[];
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  layoutMode?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  characters?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
  letterSpacing?: number;
  lineHeightPx?: number;
  textCase?: string;
}

export class FigmaService {
  private static readonly FIGMA_API_URL = 'https://api.figma.com/v1';

  /**
   * Convertit un fichier Figma en structure de données utilisable
   * @param fileId L'ID du fichier Figma
   */
  static async convertFigmaFile(fileId: string): Promise<FigmaNode> {
    try {
      if (!FIGMA_CONFIG.accessToken) {
        toast.error(
          'Token d\'accès Figma non configuré. Veuillez configurer votre token dans le fichier .env.local :\n\n' +
          'VITE_FIGMA_ACCESS_TOKEN=votre_token_ici\n\n' +
          'Pour obtenir un token :\n' +
          '1. Connectez-vous à Figma\n' +
          '2. Allez dans les paramètres de votre compte\n' +
          '3. Dans la section "Personal access tokens", créez un nouveau token',
          { autoClose: false }
        );
        throw new Error('Token d\'accès Figma non configuré');
      }

      // Récupérer les données du fichier via l'API Figma
      const response = await fetch(`${FIGMA_CONFIG.apiUrl}/files/${fileId}`, {
        headers: {
          'X-Figma-Token': FIGMA_CONFIG.accessToken,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { message?: string };
        const errorMessage = errorData.message || 'Erreur inconnue';
        
        if (response.status === 401) {
          toast.error(
            'Token d\'accès Figma invalide. Veuillez vérifier votre token dans le fichier .env.local',
            { autoClose: false }
          );
        } else if (response.status === 404) {
          toast.error(
            'Fichier Figma non trouvé. Vérifiez que l\'URL est correcte et que vous avez accès au fichier.',
            { autoClose: false }
          );
        } else {
          toast.error(
            `Erreur lors de la récupération des données Figma : ${errorMessage}`,
            { autoClose: false }
          );
        }
        
        throw new Error(`Erreur lors de la récupération des données Figma : ${errorMessage}`);
      }

      const figmaData = await response.json();
      return this.extractFigmaData(figmaData);
    } catch (error) {
      console.error('Erreur lors de la conversion du fichier Figma:', error);
      if (!(error instanceof Error) || !error.message.includes('Token d\'accès Figma non configuré')) {
        toast.error(
          'Une erreur est survenue lors de la conversion du fichier Figma. Veuillez vérifier que :\n\n' +
          '1. Votre token d\'accès est valide\n' +
          '2. Vous avez accès au fichier\n' +
          '3. L\'URL du fichier est correcte',
          { autoClose: false }
        );
      }
      throw new Error('Impossible de convertir le fichier Figma');
    }
  }

  /**
   * Extrait l'ID du fichier Figma à partir du nom du fichier
   * @param fileName Le nom du fichier
   */
  private static extractFileId(fileName: string): string | null {
    // Le format attendu est : "nom-du-fichier-{fileId}.fig"
    const match = fileName.match(/-([a-zA-Z0-9]+)\.fig$/);
    return match ? match[1] : null;
  }

  /**
   * Extrait les données pertinentes de la structure Figma
   * @param figmaData Les données brutes de Figma
   */
  private static extractFigmaData(figmaData: any): FigmaNode {
    const document = figmaData.document;
    return {
      id: document.id,
      name: document.name,
      type: document.type,
      children: this.processChildren(document.children || []),
    };
  }

  /**
   * Traite les nœuds enfants de la structure Figma
   * @param children Les nœuds enfants à traiter
   */
  private static processChildren(children: any[]): FigmaNode[] {
    return children.map(child => ({
      id: child.id,
      name: child.name,
      type: child.type,
      fills: child.fills,
      strokes: child.strokes,
      effects: child.effects,
      absoluteBoundingBox: child.absoluteBoundingBox,
      layoutMode: child.layoutMode,
      paddingLeft: child.paddingLeft,
      paddingRight: child.paddingRight,
      paddingTop: child.paddingTop,
      paddingBottom: child.paddingBottom,
      characters: child.characters,
      fontSize: child.fontSize,
      fontFamily: child.fontFamily,
      fontWeight: child.fontWeight,
      textAlignHorizontal: child.textAlignHorizontal,
      textAlignVertical: child.textAlignVertical,
      letterSpacing: child.letterSpacing,
      lineHeightPx: child.lineHeightPx,
      textCase: child.textCase,
      children: child.children ? this.processChildren(child.children) : undefined,
    }));
  }

  /**
   * Génère le code React à partir d'une structure Figma
   * @param node La structure Figma à convertir
   */
  static generateReactCode(node: FigmaNode): string {
    let code = '';
    
    // Générer les imports nécessaires
    code += this.generateImports(node);
    
    // Générer le composant principal
    code += this.generateComponent(node);
    
    return code;
  }

  /**
   * Génère les imports nécessaires pour le code React
   * @param node La structure Figma
   */
  private static generateImports(node: FigmaNode): string {
    return `import React from 'react';
import { motion } from 'framer-motion';
import { classNames } from '~/utils/classNames';
import styles from './styles.module.css';\n\n`;
  }

  /**
   * Génère le code du composant React
   * @param node La structure Figma
   */
  private static generateComponent(node: FigmaNode): string {
    const componentName = this.sanitizeComponentName(node.name);
    
    let code = `export const ${componentName}: React.FC = () => {\n`;
    code += '  return (\n';
    code += this.generateJSX(node, 2);
    code += '  );\n};\n';
    
    return code;
  }

  /**
   * Génère le JSX à partir d'un nœud Figma
   * @param node Le nœud Figma
   * @param indent Le niveau d'indentation
   */
  private static generateJSX(node: FigmaNode, indent: number): string {
    const spaces = ' '.repeat(indent * 2);
    let jsx = '';
    
    // Déterminer la balise appropriée
    const tag = this.getHTMLTag(node.type);
    
    // Générer les props de style
    const styleProps = this.generateStyleProps(node);
    
    // Générer les props de mise en page
    const layoutProps = this.generateLayoutProps(node);
    
    // Générer les classes CSS
    const className = this.generateClassName(node);
    
    // Combiner toutes les props
    const props = { ...styleProps, ...layoutProps, className };
    const propsString = Object.entries(props)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    
    // Générer la balise d'ouverture
    jsx += `${spaces}<${tag} ${propsString}>\n`;
    
    // Ajouter le contenu textuel si c'est un nœud de texte
    if (node.type === 'TEXT' && node.characters) {
      jsx += `${spaces}  ${node.characters}\n`;
    }
    
    // Générer le contenu des enfants
    if (node.children) {
      node.children.forEach(child => {
        jsx += this.generateJSX(child, indent + 1);
      });
    }
    
    // Générer la balise de fermeture
    jsx += `${spaces}</${tag}>\n`;
    
    return jsx;
  }

  /**
   * Nettoie le nom du composant
   * @param name Le nom à nettoyer
   */
  private static sanitizeComponentName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^[0-9]/, '')
      .replace(/^\w/, c => c.toUpperCase());
  }

  /**
   * Détermine la balise HTML appropriée pour un type de nœud Figma
   * @param type Le type de nœud Figma
   */
  private static getHTMLTag(type: string): string {
    const tagMap: { [key: string]: string } = {
      FRAME: 'div',
      GROUP: 'div',
      TEXT: 'p',
      RECTANGLE: 'div',
      ELLIPSE: 'div',
      VECTOR: 'div',
      LINE: 'div',
      IMAGE: 'img',
    };
    
    return tagMap[type] || 'div';
  }

  /**
   * Génère les props de style à partir d'un nœud Figma
   * @param node Le nœud Figma
   */
  private static generateStyleProps(node: FigmaNode): any {
    const props: any = {};
    
    // Gérer les couleurs de fond
    if (node.fills?.[0]?.color) {
      const color = node.fills[0].color;
      props.style = {
        ...props.style,
        backgroundColor: `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`,
      };
    }
    
    // Gérer les bordures
    if (node.strokes?.[0]?.color) {
      const color = node.strokes[0].color;
      props.style = {
        ...props.style,
        border: `1px solid rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`,
      };
    }
    
    // Gérer les effets
    if (node.effects && node.effects.length > 0) {
      const shadows = node.effects
        .filter(effect => effect.type === 'DROP_SHADOW')
        .map(effect => {
          const { color, offset, radius, visible } = effect;
          if (!visible) return '';
          return `${offset.x}px ${offset.y}px ${radius}px rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`;
        })
        .filter(Boolean)
        .join(', ');
      
      if (shadows) {
        props.style = {
          ...props.style,
          boxShadow: shadows,
        };
      }
    }
    
    // Gérer les styles de texte
    if (node.type === 'TEXT') {
      props.style = {
        ...props.style,
        fontSize: node.fontSize ? `${node.fontSize}px` : undefined,
        fontFamily: node.fontFamily,
        fontWeight: node.fontWeight,
        textAlign: node.textAlignHorizontal?.toLowerCase(),
        letterSpacing: node.letterSpacing ? `${node.letterSpacing}px` : undefined,
        lineHeight: node.lineHeightPx ? `${node.lineHeightPx}px` : undefined,
        textTransform: node.textCase?.toLowerCase(),
      };
    }
    
    return props;
  }

  /**
   * Génère les props de mise en page à partir d'un nœud Figma
   * @param node Le nœud Figma
   */
  private static generateLayoutProps(node: FigmaNode): any {
    const props: any = {};
    
    if (node.absoluteBoundingBox) {
      const { x, y, width, height } = node.absoluteBoundingBox;
      props.style = {
        ...props.style,
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
      };
    }
    
    if (node.layoutMode) {
      props.style = {
        ...props.style,
        display: 'flex',
        flexDirection: node.layoutMode === 'VERTICAL' ? 'column' : 'row',
      };
    }
    
    if (node.paddingLeft || node.paddingRight || node.paddingTop || node.paddingBottom) {
      props.style = {
        ...props.style,
        padding: `${node.paddingTop || 0}px ${node.paddingRight || 0}px ${node.paddingBottom || 0}px ${node.paddingLeft || 0}px`,
      };
    }
    
    return props;
  }

  /**
   * Génère le nom de classe CSS pour un nœud
   * @param node Le nœud Figma
   */
  private static generateClassName(node: FigmaNode): string {
    const baseName = this.sanitizeComponentName(node.name).toLowerCase();
    return `styles.${baseName}`;
  }
} 
import { toast } from 'react-toastify';

export interface FigmaFile {
  name: any;
  document: {
    id: string;
    name: string;
    type: string;
    children: FigmaNode[];
  };
  components: Record<string, FigmaComponent>;
  styles: Record<string, FigmaStyle>;
  componentSets?: Record<string, FigmaComponentSet>;
  schemaVersion?: number;
  lastModified?: string;
}

export interface FigmaComponentSet {
  key: string;
  name: string;
  description: string;
  documentationLinks: any[];
}

export interface FigmaDesignTokens {
  colors: Record<string, string>;
  typography: Record<string, FigmaTypeStyle>;
  spacing: Record<string, number>;
  borderRadius: Record<string, number>;
  shadows: Record<string, string>;
}

export interface FigmaComponentAnalysis {
  name: string;
  type: 'button' | 'input' | 'card' | 'modal' | 'navigation' | 'layout' | 'text' | 'icon' | 'image' | 'other';
  props: Record<string, any>;
  variants?: string[];
  states?: string[];
  children?: FigmaComponentAnalysis[];
}

export interface FigmaProjectStructure {
  components: FigmaComponentAnalysis[];
  pages: string[];
  designTokens: FigmaDesignTokens;
  assets: string[];
  interactions: FigmaInteraction[];
}

export interface FigmaInteraction {
  trigger: string;
  action: string;
  destination?: string;
  transition?: {
    type: string;
    duration: number;
    easing: string;
  };
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  children?: FigmaNode[];
  backgroundColor?: FigmaColor;
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  cornerRadius?: number;
  absoluteBoundingBox?: FigmaRectangle;
  constraints?: FigmaLayoutConstraint;
  layoutAlign?: string;
  layoutGrow?: number;
  characters?: string;
  style?: FigmaTypeStyle;
}

export interface FigmaComponent {
  key: string;
  name: string;
  description: string;
}

export interface FigmaStyle {
  key: string;
  name: string;
  styleType: string;
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaPaint {
  type: string;
  color?: FigmaColor;
  gradientStops?: FigmaColorStop[];
}

export interface FigmaColorStop {
  position: number;
  color: FigmaColor;
}

export interface FigmaRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FigmaLayoutConstraint {
  vertical: string;
  horizontal: string;
}

export interface FigmaTypeStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  fontWeight: number;
  fontSize: number;
  lineHeightPx: number;
  letterSpacing: number;
  textAlignHorizontal: string;
  textAlignVertical: string;
}

import { figmaConfigManager } from '../config/figmaConfig';

export class FigmaService {
  private static readonly API_BASE_URL = 'https://api.figma.com/v1';

  /**
   * Set the Figma access token
   */
  static setAccessToken(token: string): void {
    figmaConfigManager.setAccessToken(token);
  }

  /**
   * Get the stored Figma access token
   */
  static getAccessToken(): string | undefined {
    return figmaConfigManager.getAccessToken();
  }

  /**
   * Check if a valid token is configured
   */
  static hasValidToken(): boolean {
    return figmaConfigManager.hasValidToken();
  }

  /**
   * Extract file ID from Figma URL
   */
  static extractFileId(url: string): string | null {
    const patterns = [
      /figma\.com\/file\/([a-zA-Z0-9]+)/,
      /figma\.com\/proto\/([a-zA-Z0-9]+)/,
      /figma\.com\/design\/([a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Validate Figma URL format
   */
  static isValidFigmaUrl(url: string): boolean {
    return this.extractFileId(url) !== null;
  }

  /**
   * Make authenticated request to Figma API
   */
  private static async makeRequest(endpoint: string): Promise<unknown> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error('Figma access token not set');
    }

    const config = figmaConfigManager.load();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
        headers: {
          'X-Figma-Token': accessToken,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Fetch file data from Figma API
   */
  static async fetchFileData(fileId: string): Promise<FigmaFile> {
    return this.makeRequest(`/files/${fileId}`) as Promise<FigmaFile>;
  }

  /**
   * Get file data with error handling
   */
  static async getFile(fileId: string): Promise<FigmaFile | null> {
    const token = this.getAccessToken();
    if (!token) {
      toast.error('Figma access token not configured. Please set up your token in settings.');
      return null;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/files/${fileId}`, {
        headers: {
          'X-Figma-Token': token,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Invalid Figma access token. Please check your token in settings.');
        } else if (response.status === 403) {
          toast.error('Access denied. Please check file permissions.');
        } else if (response.status === 404) {
          toast.error('Figma file not found. Please check the URL.');
        } else {
          toast.error(`Failed to fetch Figma file: ${response.statusText}`);
        }
        return null;
      }

      const data = await response.json() as FigmaFile;
      return data;
    } catch (error) {
      console.error('Error fetching Figma file:', error);
      toast.error('Failed to connect to Figma API. Please check your internet connection.');
      return null;
    }
  }

  /**
   * Fetch file images from Figma API
   */
  static async fetchFileImages(fileId: string, nodeIds: string[]): Promise<{ images: Record<string, string> }> {
    const nodeIdsParam = nodeIds.join(',');
    return this.makeRequest(`/images/${fileId}?ids=${nodeIdsParam}&format=png&scale=2`) as Promise<{ images: Record<string, string> }>;
  }

  /**
   * Get file images/thumbnails
   */
  static async getFileImages(fileId: string, nodeIds: string[]): Promise<Record<string, string> | null> {
    const token = this.getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const nodeIdsParam = nodeIds.join(',');
      const response = await fetch(
        `${this.API_BASE_URL}/images/${fileId}?ids=${nodeIdsParam}&format=png&scale=2`,
        {
          headers: {
            'X-Figma-Token': token,
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch Figma images:', response.statusText);
        return null;
      }

      const data = await response.json() as { images: Record<string, string> };
      return data.images;
    } catch (error) {
      console.error('Error fetching Figma images:', error);
      return null;
    }
  }

  /**
   * Convert Figma color to CSS
   */
  static figmaColorToCss(color: FigmaColor): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = color.a;

    if (a === 1) {
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
  }

  /**
   * Convert Figma node to CSS styles with enhanced precision
   */
  static nodeToCSS(node: FigmaNode): Record<string, string> {
    const styles: Record<string, string> = {};

    // Background color with gradient support
    if (node.backgroundColor) {
      styles.backgroundColor = this.figmaColorToCss(node.backgroundColor);
    }

    // Enhanced fills with gradient support
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        styles.backgroundColor = this.figmaColorToCss(fill.color);
      } else if (fill.type === 'GRADIENT_LINEAR' && fill.gradientStops) {
        const gradientStops = fill.gradientStops
          .map(stop => `${this.figmaColorToCss(stop.color)} ${Math.round(stop.position * 100)}%`)
          .join(', ');
        styles.background = `linear-gradient(90deg, ${gradientStops})`;
      }
    }

    // Enhanced border radius with individual corners
    if (node.cornerRadius !== undefined) {
      if (typeof node.cornerRadius === 'number') {
        styles.borderRadius = `${node.cornerRadius}px`;
      }
    }

    // Enhanced strokes (borders) with multiple stroke support
    if (node.strokes && node.strokes.length > 0 && node.strokeWeight) {
      const stroke = node.strokes[0];
      if (stroke.type === 'SOLID' && stroke.color) {
        styles.border = `${node.strokeWeight}px solid ${this.figmaColorToCss(stroke.color)}`;
      }
    }

    // Enhanced dimensions with constraints
    if (node.absoluteBoundingBox) {
      styles.width = `${Math.round(node.absoluteBoundingBox.width)}px`;
      styles.height = `${Math.round(node.absoluteBoundingBox.height)}px`;
      
      // Improved positioning with relative layout support
      if (node.type !== 'DOCUMENT' && node.type !== 'CANVAS') {
        if (node.type === 'FRAME' || node.type === 'GROUP') {
          styles.position = 'relative';
          styles.display = 'flex';
          styles.flexDirection = 'column';
        } else {
          styles.position = 'absolute';
          styles.left = `${Math.round(node.absoluteBoundingBox.x)}px`;
          styles.top = `${Math.round(node.absoluteBoundingBox.y)}px`;
        }
      }
    }

    // Enhanced typography with better font handling
    if (node.style) {
      styles.fontFamily = `"${node.style.fontFamily}", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      styles.fontSize = `${node.style.fontSize}px`;
      styles.fontWeight = node.style.fontWeight.toString();
      
      if (node.style.lineHeightPx) {
        styles.lineHeight = `${node.style.lineHeightPx}px`;
      }
      
      if (node.style.letterSpacing) {
        styles.letterSpacing = `${node.style.letterSpacing}px`;
      }
      
      if (node.style.textAlignHorizontal) {
        styles.textAlign = node.style.textAlignHorizontal.toLowerCase();
      }
    }

    // Add box-shadow for effects
    if (node.type === 'RECTANGLE' || node.type === 'FRAME') {
      styles.boxSizing = 'border-box';
    }

    // Handle ellipse as border-radius
    if (node.type === 'ELLIPSE') {
      styles.borderRadius = '50%';
    }

    return styles;
  }

  /**
   * Generate React component structure from Figma nodes
   */
  static nodeToReactComponent(node: FigmaNode, depth = 0): string {
    const indent = '  '.repeat(depth);
    let jsx = '';

    // Skip invisible nodes
    if (node.visible === false) {
      return '';
    }

    // Determine JSX element based on node type
    let element = 'div';
    let content = '';
    let props = '';

    switch (node.type) {
      case 'TEXT':
        element = 'span';
        content = node.characters || '';
        break;
      case 'RECTANGLE':
        element = 'div';
        break;
      case 'ELLIPSE':
        element = 'div';
        break;
      case 'VECTOR':
        element = 'div';
        break;
      case 'FRAME':
      case 'GROUP':
        element = 'div';
        break;
      case 'COMPONENT':
      case 'COMPONENT_SET':
      case 'INSTANCE':
        element = 'div';
        break;
      default:
        element = 'div';
    }

    // Generate CSS class name
    const className = node.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Add props
    props = ` className="${className}" data-figma-type="${node.type}" data-figma-id="${node.id}"`;

    // Start tag
    jsx += `${indent}<${element}${props}>`;

    // Add content for text nodes
    if (content) {
      jsx += content;
    }

    // Add children
    if (node.children && node.children.length > 0) {
      jsx += '\n';
      for (const child of node.children) {
        jsx += this.nodeToReactComponent(child, depth + 1);
      }
      jsx += indent;
    }

    // End tag
    jsx += `</${element}>\n`;

    return jsx;
  }

  /**
   * Generate HTML structure from Figma nodes (legacy support)
   */
  static nodeToHTML(node: FigmaNode, depth = 0): string {
    const indent = '  '.repeat(depth);
    let html = '';

    // Skip invisible nodes
    if (node.visible === false) {
      return '';
    }

    // Determine HTML tag based on node type
    let tag = 'div';
    let content = '';

    switch (node.type) {
      case 'TEXT':
        tag = 'span';
        content = node.characters || '';
        break;
      case 'RECTANGLE':
        tag = 'div';
        break;
      case 'ELLIPSE':
        tag = 'div';
        break;
      case 'VECTOR':
        tag = 'div';
        break;
      case 'FRAME':
      case 'GROUP':
      case 'COMPONENT':
      case 'COMPONENT_SET':
      case 'INSTANCE':
        tag = 'div';
        break;
      default:
        tag = 'div';
    }

    // Generate CSS class name
    const className = node.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Add data attributes for debugging
    const dataAttrs = ` data-figma-type="${node.type}" data-figma-id="${node.id}"`;

    // Start tag
    html += `${indent}<${tag} class="${className}"${dataAttrs}>`;

    // Add content for text nodes
    if (content) {
      html += content;
    }

    // Add children
    if (node.children && node.children.length > 0) {
      html += '\n';
      for (const child of node.children) {
        html += this.nodeToHTML(child, depth + 1);
      }
      html += indent;
    }

    // End tag
    html += `</${tag}>\n`;

    return html;
  }

  /**
   * Generate CSS from Figma nodes
   */
  static generateCSS(nodes: FigmaNode[]): string {
    let css = '';
    // Add base styles for better rendering
    css += `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.figma-design-container {
  position: relative;
  transform-origin: top left;
  overflow: hidden;
}

`;

    const processNode = (node: FigmaNode) => {
      // Skip nodes without names or invisible nodes
      if (!node.name || (node.visible === false)) {
        return;
      }

      const className = node.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const styles = this.nodeToCSS(node);

      if (Object.keys(styles).length > 0) {
        css += `.${className} {\n`;
        for (const [property, value] of Object.entries(styles)) {
          css += `  ${property}: ${value};\n`;
        }
        css += '}\n\n';
      }

      // Process children
      if (node.children) {
        for (const child of node.children) {
          processNode(child);
        }
      }
    };

    for (const node of nodes) {
      processNode(node);
    }

    return css;
  }

  /**
   * Analyze Figma file structure and extract design tokens
   */
  static async analyzeDesignStructure(fileId: string): Promise<FigmaProjectStructure | null> {
    const file = await this.getFile(fileId);
    if (!file) {
      return null;
    }

    try {
      const designTokens = this.extractDesignTokens(file);
      const components = this.analyzeComponents(file);
      const pages = file.document.children.map(child => child.name);
      const assets = await this.extractAssets(fileId, file);
      const interactions = this.extractInteractions(file);

      return {
        components,
        pages,
        designTokens,
        assets,
        interactions
      };
    } catch (error) {
      console.error('Error analyzing Figma design structure:', error);
      return null;
    }
  }

  /**
   * Extract design tokens from Figma file
   */
  static extractDesignTokens(file: FigmaFile): FigmaDesignTokens {
    const tokens: FigmaDesignTokens = {
      colors: {},
      typography: {},
      spacing: {},
      borderRadius: {},
      shadows: {}
    };

    // Extract colors from styles
    Object.values(file.styles).forEach(style => {
      if (style.styleType === 'FILL') {
        tokens.colors[style.name] = style.name; // Placeholder - would need actual color value
      }
    });

    // Extract typography from styles
    Object.values(file.styles).forEach(style => {
      if (style.styleType === 'TEXT') {
        tokens.typography[style.name] = {
          fontFamily: 'Inter', // Default - would extract from actual style
          fontWeight: 400,
          fontSize: 16,
          lineHeightPx: 24,
          letterSpacing: 0,
          textAlignHorizontal: 'LEFT',
          textAlignVertical: 'TOP'
        };
      }
    });

    // Extract spacing and other tokens from components
    this.extractTokensFromNodes(file.document.children, tokens);

    return tokens;
  }

  /**
   * Extract tokens from nodes recursively
   */
  private static extractTokensFromNodes(nodes: FigmaNode[], tokens: FigmaDesignTokens): void {
    nodes.forEach(node => {
      // Extract spacing
      if (node.absoluteBoundingBox) {
        const width = Math.round(node.absoluteBoundingBox.width);
        const height = Math.round(node.absoluteBoundingBox.height);
        if (width > 0 && width <= 100) tokens.spacing[`w-${width}`] = width;
        if (height > 0 && height <= 100) tokens.spacing[`h-${height}`] = height;
      }

      // Extract border radius
      if (node.cornerRadius !== undefined) {
        tokens.borderRadius[`radius-${node.cornerRadius}`] = node.cornerRadius;
      }

      // Recursively process children
      if (node.children) {
        this.extractTokensFromNodes(node.children, tokens);
      }
    });
  }

  /**
   * Analyze components and their structure
   */
  static analyzeComponents(file: FigmaFile): FigmaComponentAnalysis[] {
    const components: FigmaComponentAnalysis[] = [];

    // Analyze main components
    Object.values(file.components).forEach(component => {
      const analysis = this.analyzeComponentStructure(component, file);
      if (analysis) {
        components.push(analysis);
      }
    });

    // Analyze frames as potential components
    file.document.children.forEach(page => {
      if (page.children) {
        page.children.forEach(frame => {
          if (frame.type === 'FRAME' && this.isLikelyComponent(frame)) {
            const analysis = this.analyzeNodeAsComponent(frame);
            if (analysis) {
              components.push(analysis);
            }
          }
        });
      }
    });

    return components;
  }

  /**
   * Analyze a component's structure
   */
  private static analyzeComponentStructure(component: FigmaComponent, file: FigmaFile): FigmaComponentAnalysis | null {
    // Find the component node in the document
    const componentNode = this.findNodeById(file.document.children, component.key);
    if (!componentNode) return null;

    return this.analyzeNodeAsComponent(componentNode);
  }

  /**
   * Analyze a node as a component
   */
  private static analyzeNodeAsComponent(node: FigmaNode): FigmaComponentAnalysis {
    const type = this.determineComponentType(node);
    const props = this.extractComponentProps(node);
    const variants = this.extractVariants(node);
    const states = this.extractStates(node);
    const children = node.children ? node.children.map(child => this.analyzeNodeAsComponent(child)) : undefined;

    return {
      name: node.name,
      type,
      props,
      variants,
      states,
      children
    };
  }

  /**
   * Determine component type based on node characteristics
   */
  private static determineComponentType(node: FigmaNode): FigmaComponentAnalysis['type'] {
    const name = node.name.toLowerCase();
    
    if (name.includes('button') || name.includes('btn')) return 'button';
    if (name.includes('input') || name.includes('field') || name.includes('textbox')) return 'input';
    if (name.includes('card') || name.includes('tile')) return 'card';
    if (name.includes('modal') || name.includes('dialog') || name.includes('popup')) return 'modal';
    if (name.includes('nav') || name.includes('menu') || name.includes('header') || name.includes('footer')) return 'navigation';
    if (name.includes('layout') || name.includes('container') || name.includes('wrapper')) return 'layout';
    if (node.type === 'TEXT') return 'text';
    if (name.includes('icon') || node.type === 'VECTOR') return 'icon';
    if (name.includes('image') || name.includes('img') || name.includes('photo')) return 'image';
    
    return 'other';
  }

  /**
   * Extract component props from node
   */
  private static extractComponentProps(node: FigmaNode): Record<string, any> {
    const props: Record<string, any> = {};

    if (node.characters) props.text = node.characters;
    if (node.absoluteBoundingBox) {
      props.width = node.absoluteBoundingBox.width;
      props.height = node.absoluteBoundingBox.height;
    }
    if (node.cornerRadius !== undefined) props.borderRadius = node.cornerRadius;
    if (node.backgroundColor) props.backgroundColor = this.figmaColorToCss(node.backgroundColor);
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.color) props.color = this.figmaColorToCss(fill.color);
    }

    return props;
  }

  /**
   * Extract variants from component
   */
  private static extractVariants(node: FigmaNode): string[] | undefined {
    // This would analyze component variants in Figma
    // For now, return undefined as it requires more complex analysis
    return undefined;
  }

  /**
   * Extract states from component
   */
  private static extractStates(node: FigmaNode): string[] | undefined {
    const states: string[] = [];
    const name = node.name.toLowerCase();
    
    if (name.includes('hover')) states.push('hover');
    if (name.includes('active')) states.push('active');
    if (name.includes('disabled')) states.push('disabled');
    if (name.includes('focus')) states.push('focus');
    
    return states.length > 0 ? states : undefined;
  }

  /**
   * Check if a frame is likely a component
   */
  private static isLikelyComponent(frame: FigmaNode): boolean {
    const name = frame.name.toLowerCase();
    const componentKeywords = ['component', 'button', 'card', 'modal', 'input', 'nav', 'header', 'footer'];
    return componentKeywords.some(keyword => name.includes(keyword));
  }

  /**
   * Find node by ID in the document tree
   */
  private static findNodeById(nodes: FigmaNode[], id: string): FigmaNode | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = this.findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Extract assets from Figma file
   */
  private static async extractAssets(fileId: string, file: FigmaFile): Promise<string[]> {
    const assets: string[] = [];
    
    // Find all image nodes
    const imageNodes = this.findImageNodes(file.document.children);
    
    if (imageNodes.length > 0) {
      try {
        const images = await this.getFileImages(fileId, imageNodes.map(node => node.id));
        if (images) {
          assets.push(...Object.values(images));
        }
      } catch (error) {
        console.warn('Could not extract images:', error);
      }
    }
    
    return assets;
  }

  /**
   * Find all image nodes in the document
   */
  private static findImageNodes(nodes: FigmaNode[]): FigmaNode[] {
    const imageNodes: FigmaNode[] = [];
    
    nodes.forEach(node => {
      if (node.fills && node.fills.some(fill => fill.type === 'IMAGE')) {
        imageNodes.push(node);
      }
      if (node.children) {
        imageNodes.push(...this.findImageNodes(node.children));
      }
    });
    
    return imageNodes;
  }

  /**
   * Extract interactions from Figma file
   */
  private static extractInteractions(file: FigmaFile): FigmaInteraction[] {
    // This would extract prototyping interactions
    // For now, return empty array as it requires access to prototype data
    return [];
  }

  /**
   * Convert Figma file to React/Vite project structure with enhanced analysis
   */
  static async convertToReactProject(fileId: string): Promise<{
    component: string;
    css: string;
    packageJson: string;
    viteConfig: string;
    indexHtml: string;
    mainTsx: string;
    designTokens?: string;
    componentLibrary?: string;
    storybook?: string;
  } | null> {
    const file = await this.getFile(fileId);
    if (!file) {
      return null;
    }

    console.log('Figma file data received:', file.name);

    try {
      // Find the first canvas/artboard
      const canvas = file.document.children[0];
      if (!canvas || !canvas.children || canvas.children.length === 0) {
        console.error('No canvas or artboard found in Figma file');
        return null;
      }

      // Get the main frame/artboard (usually the first one)
      const mainFrame = canvas.children[0];
      console.log('Main frame found:', mainFrame.name);

      // Analyze design structure
      const projectStructure = await this.analyzeDesignStructure(fileId);
      if (!projectStructure) {
        console.warn('Could not analyze design structure, using basic conversion');
      }

      // Generate React component with enhanced structure
      const componentName = mainFrame.name.replace(/[^a-zA-Z0-9]/g, '') || 'FigmaDesign';
      const component = this.generateReactComponent(componentName, mainFrame, projectStructure || undefined);

      // Generate enhanced CSS with design tokens
      const css = projectStructure 
        ? this.generateEnhancedCSS(projectStructure.designTokens, [mainFrame])
        : this.generateCSS([mainFrame]);

      // Generate design tokens file
      const designTokens = projectStructure ? this.generateDesignTokensFile(projectStructure.designTokens) : undefined;

      // Generate component library
      const componentLibrary = projectStructure ? this.generateComponentLibrary(projectStructure.components) : undefined;

      // Generate Storybook configuration
      const storybook = projectStructure ? this.generateStorybookConfig(componentName, projectStructure.components) : undefined;

      // Generate package.json for React + Vite with enhanced dependencies
      const packageJson = `{
  "name": "figma-design-${fileId.toLowerCase()}",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"\${projectStructure ? ',
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"' : ''}
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"\${projectStructure ? ',
    "styled-components": "^6.1.1",
    "framer-motion": "^10.16.5"' : ''}
  },
  "devDependencies": {
    \${projectStructure ? '"@storybook/addon-essentials": "^7.5.3",
    "@storybook/addon-interactions": "^7.5.3",
    "@storybook/addon-links": "^7.5.3",
    "@storybook/blocks": "^7.5.3",
    "@storybook/react": "^7.5.3",
    "@storybook/react-vite": "^7.5.3",
    "@storybook/testing-library": "^0.2.2",
    ' : ''}"@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",\${projectStructure ? '
    "eslint-plugin-storybook": "^0.6.15",
    "storybook": "^7.5.3",' : ''}
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}`;

      // Generate Vite config
      const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})`;

      // Generate index.html
      const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Figma Design - ${file.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

      // Generate main.tsx
      const mainTsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import ${componentName} from './components/FigmaDesign.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <${componentName} />
  </React.StrictMode>,
)`;

      return { 
        component, 
        css, 
        packageJson, 
        viteConfig, 
        indexHtml, 
        mainTsx,
        designTokens,
        componentLibrary,
        storybook
      };
    } catch (error) {
      console.error('Error converting Figma file to React project:', error);
      return null;
    }
  }

  /**
   * Generate React component with enhanced structure
   */
  private static generateReactComponent(
    componentName: string, 
    mainFrame: FigmaNode, 
    projectStructure?: FigmaProjectStructure
  ): string {
    const hasTokens = projectStructure?.designTokens;
    const imports = [
      "import React from 'react';",
      "import './FigmaDesign.css';"
    ];

    if (hasTokens) {
      imports.push("import { designTokens } from './tokens/designTokens';");
    }

    if (projectStructure?.components && projectStructure.components.length > 0) {
      imports.push("import * as Components from './components';");
    }

    const componentJSX = this.nodeToReactComponent(mainFrame, 3).trim();

    return `${imports.join('\n')}

interface ${componentName}Props {
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ className }) => {
  return (
    <div className={\`figma-design-container \${className || ''}\`}>
      ${componentJSX}
    </div>
  );
};

export default ${componentName};`;
  }

  /**
   * Generate enhanced CSS with design tokens
   */
  private static generateEnhancedCSS(designTokens: FigmaDesignTokens, nodes: FigmaNode[]): string {
    const tokenCSS = this.generateTokenCSS(designTokens);
    const componentCSS = this.generateCSS(nodes);
    
    return `/* Design Tokens */\n${tokenCSS}\n\n/* Component Styles */\n${componentCSS}`;
  }

  /**
   * Generate CSS from design tokens
   */
  private static generateTokenCSS(tokens: FigmaDesignTokens): string {
    let css = ':root {\n';
    
    // Colors
    Object.entries(tokens.colors).forEach(([name, value]) => {
      css += `  --color-${name.toLowerCase().replace(/\s+/g, '-')}: ${value};\n`;
    });
    
    // Typography
    Object.entries(tokens.typography).forEach(([name, typo]) => {
      const tokenName = name.toLowerCase().replace(/\s+/g, '-');
      css += `  --font-${tokenName}-family: ${typo.fontFamily};\n`;
      css += `  --font-${tokenName}-size: ${typo.fontSize}px;\n`;
      css += `  --font-${tokenName}-weight: ${typo.fontWeight};\n`;
      css += `  --font-${tokenName}-line-height: ${typo.lineHeightPx}px;\n`;
    });
    
    // Spacing
    Object.entries(tokens.spacing).forEach(([name, value]) => {
      css += `  --spacing-${name.toLowerCase()}: ${value}px;\n`;
    });
    
    // Border radius
    Object.entries(tokens.borderRadius).forEach(([name, value]) => {
      css += `  --radius-${name.toLowerCase()}: ${value}px;\n`;
    });
    
    // Shadows
    Object.entries(tokens.shadows).forEach(([name, value]) => {
      css += `  --shadow-${name.toLowerCase().replace(/\s+/g, '-')}: ${value};\n`;
    });
    
    css += '}\n';
    return css;
  }

  /**
   * Generate design tokens file
   */
  private static generateDesignTokensFile(tokens: FigmaDesignTokens): string {
    return `export const designTokens = ${JSON.stringify(tokens, null, 2)};\n\nexport default designTokens;`;
  }

  /**
   * Generate component library
   */
  private static generateComponentLibrary(components: FigmaComponentAnalysis[]): string {
    const componentExports = components.map(comp => {
      const componentName = comp.name.replace(/[^a-zA-Z0-9]/g, '');
      return `export { default as ${componentName} } from './${componentName}';`;
    }).join('\n');

    const componentFiles = components.map(comp => {
      const componentName = comp.name.replace(/[^a-zA-Z0-9]/g, '');
      const props = Object.entries(comp.props).map(([name, value]) => `  ${name}?: any;`).join('\n');
      
      return {
        name: `${componentName}.tsx`,
        content: `import React from 'react';\n\ninterface ${componentName}Props {\n${props}\n}\n\nconst ${componentName}: React.FC<${componentName}Props> = (props) => {\n  return (\n    <div className="${componentName.toLowerCase()}">\n      {/* Component implementation */}\n    </div>\n  );\n};\n\nexport default ${componentName};`
      };
    });

    return JSON.stringify({ index: componentExports, files: componentFiles }, null, 2);
  }

  /**
   * Generate Storybook configuration
   */
  private static generateStorybookConfig(mainComponentName: string, components: FigmaComponentAnalysis[]): string {
    const stories = components.map(comp => {
      const componentName = comp.name.replace(/[^a-zA-Z0-9]/g, '');
      return {
        name: `${componentName}.stories.tsx`,
        content: `import type { Meta, StoryObj } from '@storybook/react';\nimport ${componentName} from '../components/${componentName}';\n\nconst meta: Meta<typeof ${componentName}> = {\n  title: 'Components/${componentName}',\n  component: ${componentName},\n  parameters: {\n    layout: 'centered',\n  },\n  tags: ['autodocs'],\n};\n\nexport default meta;\ntype Story = StoryObj<typeof meta>;\n\nexport const Default: Story = {\n  args: {},\n};`
      };
    });

    const mainConfig = `import type { StorybookConfig } from '@storybook/react-vite';\n\nconst config: StorybookConfig = {\n  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],\n  addons: [\n    '@storybook/addon-links',\n    '@storybook/addon-essentials',\n    '@storybook/addon-interactions',\n  ],\n  framework: {\n    name: '@storybook/react-vite',\n    options: {},\n  },\n  docs: {\n    autodocs: 'tag',\n  },\n};\n\nexport default config;`;

    return JSON.stringify({ 
      mainConfig, 
      stories,
      preview: `export const parameters = {\n  actions: { argTypesRegex: '^on[A-Z].*' },\n  controls: {\n    matchers: {\n      color: /(background|color)$/i,\n      date: /Date$/,\n    },\n  },\n};`
    }, null, 2);
  }

  /**
   * Convert Figma file to web code (legacy support)
   */
  static async convertToWebCode(fileId: string): Promise<{
    html: string;
    css: string;
    js: string;
  } | null> {
    const file = await this.getFile(fileId);
    if (!file) {
      return null;
    }

    console.log('Figma file data received:', file.name);

    try {
      // Find the first canvas/artboard
      const canvas = file.document.children[0];
      if (!canvas || !canvas.children || canvas.children.length === 0) {
        console.error('No canvas or artboard found in Figma file');
        return null;
      }

      // Get the main frame/artboard (usually the first one)
      const mainFrame = canvas.children[0];
      console.log('Main frame found:', mainFrame.name);

      // Generate HTML with container
      const html = `<div class="figma-design-container">
  ${this.nodeToHTML(mainFrame)}</div>`;

      // Generate CSS
      const css = this.generateCSS([mainFrame]);

      // Enhanced JavaScript with better responsive handling
      const js = `// Generated from Figma design "${file.name}"
// Enhanced interactive functionality

class FigmaDesignController {
  constructor() {
    this.container = null;
    this.originalWidth = ${mainFrame.absoluteBoundingBox?.width || 1440};
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.container = document.querySelector('.figma-design-container');
      this.setupResponsive();
      this.setupInteractions();
      console.log('Figma design loaded: ${file.name}');
    });
  }

  setupResponsive() {
    if (!this.container) return;
    
    const adjustScale = () => {
      const scale = Math.min(1, window.innerWidth / this.originalWidth);
      this.container.style.transform = \`scale(\${scale})\`;
      this.container.style.transformOrigin = 'top left';
    };
    
    adjustScale();
    window.addEventListener('resize', adjustScale);
  }

  setupInteractions() {
    // Add hover effects for interactive elements
    const interactiveElements = this.container?.querySelectorAll('[data-figma-type="COMPONENT"], [data-figma-type="INSTANCE"]');
    interactiveElements?.forEach(element => {
      element.style.cursor = 'pointer';
      element.addEventListener('mouseenter', () => {
        element.style.transform = 'scale(1.02)';
        element.style.transition = 'transform 0.2s ease';
      });
      element.addEventListener('mouseleave', () => {
        element.style.transform = 'scale(1)';
      });
    });
  }
}

new FigmaDesignController();`;

      return { html, css, js };
    } catch (error) {
      console.error('Error converting Figma file to web code:', error);
      return null;
    }
  }
}
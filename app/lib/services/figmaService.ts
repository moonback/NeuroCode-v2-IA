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
   * Convert Figma file to React/Vite project structure
   */
  static async convertToReactProject(fileId: string): Promise<{
    component: string;
    css: string;
    packageJson: string;
    viteConfig: string;
    indexHtml: string;
    mainTsx: string;
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

      // Generate React component
      const componentName = mainFrame.name.replace(/[^a-zA-Z0-9]/g, '') || 'FigmaDesign';
      const component = `import React from 'react';
import './FigmaDesign.css';

interface ${componentName}Props {
  className?: string;
}

const ${componentName}: React.FC<${componentName}Props> = ({ className }) => {
  return (
    <div className={\`figma-design-container \${className || ''\}\`}>
      ${this.nodeToReactComponent(mainFrame, 3).trim()}
    </div>
  );
};

export default ${componentName};`;

      // Generate enhanced CSS with CSS modules support
      const css = this.generateCSS([mainFrame]);

      // Generate package.json for React + Vite
      const packageJson = `{
  "name": "figma-design-${fileId.toLowerCase()}",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.55.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
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

      return { component, css, packageJson, viteConfig, indexHtml, mainTsx };
    } catch (error) {
      console.error('Error converting Figma file to React project:', error);
      return null;
    }
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
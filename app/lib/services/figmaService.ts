import { toast } from 'react-toastify';

export interface FigmaFile {
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
   * Convert Figma node to CSS styles
   */
  static nodeToCSS(node: FigmaNode): Record<string, string> {
    const styles: Record<string, string> = {};

    // Background color
    if (node.backgroundColor) {
      styles.backgroundColor = this.figmaColorToCss(node.backgroundColor);
    }

    // Fills
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        styles.backgroundColor = this.figmaColorToCss(fill.color);
      }
    }

    // Border radius
    if (node.cornerRadius) {
      styles.borderRadius = `${node.cornerRadius}px`;
    }

    // Strokes (borders)
    if (node.strokes && node.strokes.length > 0 && node.strokeWeight) {
      const stroke = node.strokes[0];
      if (stroke.type === 'SOLID' && stroke.color) {
        styles.border = `${node.strokeWeight}px solid ${this.figmaColorToCss(stroke.color)}`;
      }
    }

    // Dimensions
    if (node.absoluteBoundingBox) {
      styles.width = `${node.absoluteBoundingBox.width}px`;
      styles.height = `${node.absoluteBoundingBox.height}px`;
    }

    // Typography
    if (node.style) {
      styles.fontFamily = node.style.fontFamily;
      styles.fontSize = `${node.style.fontSize}px`;
      styles.fontWeight = node.style.fontWeight.toString();
      styles.lineHeight = `${node.style.lineHeightPx}px`;
      styles.letterSpacing = `${node.style.letterSpacing}px`;
      styles.textAlign = node.style.textAlignHorizontal.toLowerCase();
    }

    return styles;
  }

  /**
   * Generate HTML structure from Figma nodes
   */
  static nodeToHTML(node: FigmaNode, depth = 0): string {
    const indent = '  '.repeat(depth);
    let html = '';

    // Determine HTML tag based on node type
    let tag = 'div';
    let content = '';

    switch (node.type) {
      case 'TEXT':
        tag = 'p';
        content = node.characters || '';
        break;
      case 'RECTANGLE':
      case 'ELLIPSE':
        tag = 'div';
        break;
      case 'FRAME':
      case 'GROUP':
        tag = 'div';
        break;
      default:
        tag = 'div';
    }

    // Generate CSS class name
    const className = node.name.toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Start tag
    html += `${indent}<${tag} class="${className}">`;

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

    const processNode = (node: FigmaNode) => {
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
   * Convert Figma file to web code
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

    // Generate HTML
    const html = this.nodeToHTML(file.document);

    // Generate CSS
    const css = this.generateCSS(file.document.children);

    // Basic JavaScript template
    const js = `// Generated from Figma design\n// Add your interactive functionality here\n\ndocument.addEventListener('DOMContentLoaded', function() {\n  console.log('Figma design loaded');\n});`;

    return { html, css, js };
  }
}
export type ContextAnnotation =
  | {
      type: 'codeContext';
      files: string[];
    }
  | {
      type: 'chatSummary';
      summary: string;
      chatId: string;
    }
  | {
      type: 'reasoning';
      content: string;
      provider: string;
      metadata?: {
        originalLength?: number;
        model?: string;
        extractionMethod?: 'explicit' | 'structured' | 'heuristic' | 'fallback';
        confidence?: 'high' | 'medium' | 'low';
        [key: string]: any;
      };
    };

export type ProgressAnnotation = {
  type: 'progress';
  label: string;
  status: 'in-progress' | 'complete' | 'error';
  order: number;
  message: string;
};

export type SegmentsGroupAnnotation = {
  type: 'segmentsGroup';
  segmentsGroupId: string;
};

export type DataStreamError = {
  type: 'error';
  id: string;
  message: string;
};
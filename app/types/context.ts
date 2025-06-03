export type ContextAnnotation =
  | {
      type: 'codeContext';
      files: string[];
    }
  | {
      type: 'chatSummary';
      summary: string;
      chatId: string;
    };

export type ProgressAnnotation = {
  type: 'progress';
  label: string;
  status: 'in-progress' | 'complete' | 'error';
  order: number;
  message: string;
   metadata: {
    agentId: string;
    agentName: string;
    agentModel: string;
    agentProvider: string;
}
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
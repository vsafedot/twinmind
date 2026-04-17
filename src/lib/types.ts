// Made by SIDDHARTH NAIN
export interface TranscriptChunk {
  id: string;
  text: string;
  timestamp: number;
}

export interface Suggestion {
  type: 'Question' | 'Talking Point' | 'Answer' | 'Fact-check' | 'Clarification' | string;
  preview: string;
}

export interface SuggestionBatch {
  id: string;
  timestamp: number;
  items: Suggestion[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface AppSettings {
  groqApiKey: string;
  liveSuggestionPrompt: string;
  detailedAnswerPrompt: string;
  chatPrompt: string;
  suggestionContextWindow: number;
  detailedAnswerContextWindow: number;
  refreshIntervalSeconds: number;
}

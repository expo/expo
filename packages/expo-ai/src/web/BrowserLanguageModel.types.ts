import type { ModelSchema } from '../LanguageModels.types';

// Keep the browser surface local to the adapter until it is included in TypeScript's DOM types.
export type BrowserAvailability = 'available' | 'downloadable' | 'downloading' | 'unavailable';
export type BrowserModelOptions = {
  expectedInputs?: { type: 'text'; languages?: readonly string[] }[];
  expectedOutputs?: { type: 'text'; languages?: readonly string[] }[];
};
export type BrowserCreateOptions = BrowserModelOptions & {
  initialPrompts?: { role: 'system'; content: string }[];
  signal?: AbortSignal;
  monitor?: (monitor: {
    addEventListener(event: 'downloadprogress', listener: (event: ProgressEvent) => void): void;
  }) => void;
};
export type BrowserPromptOptions = {
  signal: AbortSignal;
  responseConstraint?: ModelSchema;
};
export interface BrowserLanguageModel {
  prompt(input: string, options: BrowserPromptOptions): Promise<string>;
  promptStreaming(input: string, options: BrowserPromptOptions): ReadableStream<string>;
  clone(options: { signal: AbortSignal }): Promise<BrowserLanguageModel>;
  destroy(): void;
  addEventListener(event: 'contextoverflow', listener: () => void): void;
  removeEventListener(event: 'contextoverflow', listener: () => void): void;
}
export interface BrowserLanguageModelAPI {
  availability(options: BrowserModelOptions): Promise<BrowserAvailability>;
  create(options: BrowserCreateOptions): Promise<BrowserLanguageModel>;
}

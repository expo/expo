import type { NativeModule, SharedObject } from 'expo';

export type NativeTextEvent = { requestId: string; text: string };
export type NativePreparationEvent = {
  requestId: string;
  progress: number | null;
};
export type NativeModuleEvents = {
  onPreparationProgress: (event: NativePreparationEvent) => void;
  onBackground: () => void;
};
export type NativeToolEvent = {
  requestId: string;
  callId: string;
  name: string;
  argumentsJSON: string;
};
export type NativeSessionEvents = {
  onText: (event: NativeTextEvent) => void;
  onToolCall: (event: NativeToolEvent) => void;
};

/** @hidden */
export declare class NativeSession extends SharedObject<NativeSessionEvents> {
  /** JSON-encoded `{ text, usage }` generation result. */
  generateAsync(requestId: string, prompt: string, optionsJSON: string): Promise<string>;
  executeBuiltinToolAsync?(
    callId: string,
    kind: 'ocr' | 'barcode',
    imageLabel: string
  ): Promise<string>;
  /** Synchronously commits a completed result after shared validation and cancellation checks. */
  acceptResult(requestId: string): boolean;
  /** Discards an unaccepted result, or cancels matching work that could still produce one. */
  discardResult(requestId: string): void;
  cancel(requestId: string): void;
  /** Cancels in-flight generation and tears down the provider-side session immediately, without waiting for release. */
  dispose(): void;
  resolveTool(callId: string, output: string | null): boolean;
}

/** @hidden */
export declare class NativeLanguageModels extends NativeModule<NativeModuleEvents> {
  readonly supportsBackgroundEvents?: boolean;
  readonly supportsSessionLanguages?: boolean;
  getAvailabilityAsync(
    inputLanguages: readonly string[],
    outputLanguage: string | null
  ): Promise<string>;
  createSessionAsync(optionsJSON: string): Promise<NativeSession>;
  prepareAsync?(
    requestId: string,
    allowDownload: boolean,
    inputLanguages: readonly string[],
    outputLanguage: string | null
  ): Promise<string>;
  cancelPreparation?(requestId: string): void;
}

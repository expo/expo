/** A removable bridge listener. @hidden */
export type NativeEventSubscription = { remove(): void };

export type NativeTextEvent = { requestId: string; text: string };
export type NativePreparationEvent = {
  requestId: string;
  progress: number | null;
};
export type NativeModuleEvents = {
  onPreparationProgress: NativePreparationEvent;
  onBackground: Record<string, never>;
};
export type NativeToolEvent = {
  requestId: string;
  callId: string;
  name: string;
  argumentsJSON: string;
};

/** @hidden */
export interface NativeSession {
  generateAsync(requestId: string, prompt: string, optionsJSON: string): Promise<string>;
  generateWithMetadataAsync?(
    requestId: string,
    prompt: string,
    optionsJSON: string
  ): Promise<string>;
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
  dispose(): void;
  release(): void;
  resolveTool(callId: string, output: string | null, error: string | null): boolean;
  addListener(event: 'onText', listener: (event: NativeTextEvent) => void): NativeEventSubscription;
  addListener(
    event: 'onToolCall',
    listener: (event: NativeToolEvent) => void
  ): NativeEventSubscription;
}

/** @hidden */
export interface NativeLanguageModels {
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
  addListener?<E extends keyof NativeModuleEvents>(
    event: E,
    listener: (event: NativeModuleEvents[E]) => void
  ): NativeEventSubscription;
}

import type { NativeModule, SharedObject } from 'expo';

/**
 * A provisional text snapshot from a generation that asked for streaming. `text` is everything
 * generated so far rather than the fragment added since the previous event, so a consumer replaces
 * the previous snapshot instead of appending to it. While a schema constrains the output it is raw
 * JSON text that is usually still incomplete.
 *
 * `requestId` is the correlation key of the whole contract. JavaScript mints it, passes it into the
 * call that starts the work, and then uses it to match every later event and every `cancel`,
 * `acceptResult` and `discardResult` call back to that request. A listener belongs to the session
 * or module that sends the event rather than to one request, so an event carrying any other
 * identifier is ignored instead of being read as part of the request currently being awaited.
 */
export type NativeTextEvent = { requestId: string; text: string };
/** Progress of a model download started by `prepareAsync`. */
export type NativePreparationEvent = {
  /** Identifies the `prepareAsync` call reported here, as `NativeTextEvent.requestId` explains. */
  requestId: string;
  /**
   * How much of the download has finished, as a fraction from `0` through `1`, or `null` when the
   * provider cannot compute one, such as while the total size is still unknown.
   */
  progress: number | null;
};
/** Events sent by the module itself rather than by one session. */
export type NativeModuleEvents = {
  /** Reports download progress for an in-flight `prepareAsync` call. */
  onPreparationProgress: (event: NativePreparationEvent) => void;
  /**
   * Signals that the app left the foreground, so JavaScript can fail in-flight work with
   * `ERR_APP_BACKGROUND`. It matters most while a request waits on a tool handler or an approval
   * callback, where no native call is pending that could fail on its own. A provider that never
   * sends it leaves `supportsBackgroundEvents` unset.
   */
  onBackground: () => void;
};
/**
 * A request from the provider to run one JavaScript tool. Generation stays suspended until
 * `resolveTool` answers with the same `callId`.
 */
export type NativeToolEvent = {
  /** Identifies the `generateAsync` call whose generation asked for the tool. */
  requestId: string;
  /**
   * Identifies this one tool call and is the value `resolveTool` answers with. JavaScript rejects
   * an identifier it has already seen rather than running the tool a second time.
   */
  callId: string;
  /** Name of the tool, as declared in the options passed to `createSessionAsync`. */
  name: string;
  /** The arguments, JSON-encoded. JavaScript validates them against the tool's input schema. */
  argumentsJSON: string;
};
/** Events sent by one session. */
export type NativeSessionEvents = {
  /** Delivers a cumulative text snapshot while a streaming generation runs. */
  onText: (event: NativeTextEvent) => void;
  /** Asks JavaScript to run a tool and reply through `resolveTool`. */
  onToolCall: (event: NativeToolEvent) => void;
};

/**
 * The session half of the JavaScript/native contract, implemented by the Apple, Android and web
 * providers. One session owns one conversation: a single generation runs at a time, and its result
 * stays provisional until `acceptResult` commits it, so a turn JavaScript rejects never becomes
 * context for the next one.
 *
 * Tool calls are a round trip. The provider emits `onToolCall`, JavaScript runs the matching
 * handler, and the answer returns through `resolveTool` under the same `callId`. Generation is
 * suspended in between and resumes only on that answer or on cancellation.
 *
 * `addListener` and `release()` are inherited from `SharedObject`.
 *
 * @hidden
 */
export declare class NativeSession extends SharedObject<NativeSessionEvents> {
  /**
   * Runs one conversation turn and resolves to a JSON-encoded `{ text, usage }` generation result.
   * The turn is not part of the conversation until `acceptResult` takes it.
   *
   * @param requestId Correlates this call with its events and its later acceptance or discard.
   * @param prompt The text to generate from. A provider that retains the turns it accepted
   * receives this turn alone; where JavaScript has to carry the earlier turns itself, it packs them
   * into this string alongside the new turn.
   * @param optionsJSON JSON-encoded request options: `schema`, `stream`, `maximumOutputTokens`,
   * `maximumToolCalls` and `images`.
   */
  generateAsync(requestId: string, prompt: string, optionsJSON: string): Promise<string>;
  /**
   * Runs a provider-side tool over an image attached to the current request and resolves to its
   * JSON-encoded output. Only the Apple provider declares it, so a caller checks that it exists
   * and otherwise reports the feature as unsupported.
   *
   * @param callId The `callId` of the `onToolCall` event being served.
   * @param kind Which built-in reader to run over the image.
   * @param imageLabel Label of an image supplied through the request's `images` option.
   */
  executeBuiltinToolAsync?(
    callId: string,
    kind: 'ocr' | 'barcode',
    imageLabel: string
  ): Promise<string>;
  /**
   * Synchronously commits a completed result after shared validation and cancellation checks.
   * Returns `false` when nothing was committed, because no result is waiting under `requestId` or
   * because the session was disposed or cancelled first, or, on a provider that reports
   * `supportsBackgroundEvents`, because the app left the foreground. A caller treats `false` as a
   * failed generation rather than as a reason to retry.
   */
  acceptResult(requestId: string): boolean;
  /** Discards an unaccepted result, or cancels matching work that could still produce one. */
  discardResult(requestId: string): void;
  /**
   * Cancels the generation identified by `requestId`. JavaScript calls it from the request's own
   * abort signal.
   */
  cancel(requestId: string): void;
  /** Cancels in-flight generation and tears down the provider-side session immediately, without waiting for release. */
  dispose(): void;
  /**
   * Answers the `onToolCall` event carrying `callId` and resumes the suspended generation. An
   * `output` of `null` reports that the tool produced no usable text and fails the call instead.
   * Returns `false` when no tool call is waiting under `callId`; providers that cannot request
   * tools return `false` for every call.
   */
  resolveTool(callId: string, output: string | null): boolean;
}

/**
 * The module half of the contract: availability, preparation and session creation. Apple and
 * Android implement it natively, and on web a browser Prompt API adapter stands in for it. The
 * optional members are missing on providers that cannot offer them, so a caller checks for a
 * member before using it rather than assuming the whole surface is present.
 *
 * @hidden
 */
export declare class NativeLanguageModels extends NativeModule<NativeModuleEvents> {
  /**
   * `true` when the provider sends `onBackground`. Where it is missing, leaving the foreground
   * does not interrupt a request; its own abort signal, `dispose()` and a provider failure still
   * do.
   */
  readonly supportsBackgroundEvents?: boolean;
  /**
   * `true` when `createSessionAsync` accepts `inputLanguages` and `outputLanguage`. Where it is
   * missing, a caller omits both instead of sending options the provider would ignore.
   */
  readonly supportsSessionLanguages?: boolean;
  /**
   * Resolves to a JSON-encoded report of the model's status, the reason behind it and the
   * provider's capabilities. The requested languages narrow the answer: a provider that cannot
   * check them says so instead of assuming they are supported.
   */
  getAvailabilityAsync(
    inputLanguages: readonly string[],
    outputLanguage: string | null
  ): Promise<string>;
  /**
   * Creates a session for one conversation.
   *
   * @param optionsJSON JSON-encoded session options: `instructions`, `tools`, and the languages
   * when `supportsSessionLanguages` is `true`.
   */
  createSessionAsync(optionsJSON: string): Promise<NativeSession>;
  /**
   * Downloads the model when `allowDownload` is `true` and its assets are still missing, then
   * resolves to the JSON-encoded availability that follows. Progress arrives as
   * `onPreparationProgress` events carrying `requestId`.
   *
   * The Apple provider declares neither this nor `cancelPreparation`, because it can neither
   * trigger nor observe a system model download; a caller that finds it missing returns the
   * availability it already has. A provider that declares one of the two must declare both.
   */
  prepareAsync?(
    requestId: string,
    allowDownload: boolean,
    inputLanguages: readonly string[],
    outputLanguage: string | null
  ): Promise<string>;
  /**
   * Cancels the `prepareAsync` call with `requestId`. JavaScript calls it from the preparation's
   * abort signal.
   */
  cancelPreparation?(requestId: string): void;
}

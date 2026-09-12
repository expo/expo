/** Stable failure codes shared by preparation, sessions, and one-shot tasks. */
export type LanguageModelErrorCode =
  | 'ERR_ABORTED'
  | 'ERR_APP_BACKGROUND'
  | 'ERR_AVAILABILITY_FAILED'
  | 'ERR_COMPLETION_FAILED'
  | 'ERR_COMPLETION_INVALID'
  | 'ERR_CONTEXT_WINDOW_EXCEEDED'
  | 'ERR_GENERATION_FAILED'
  | 'ERR_MODEL_NOT_READY'
  | 'ERR_MODEL_REFUSAL'
  | 'ERR_MODEL_UNAVAILABLE'
  | 'ERR_OPTIONS_INVALID'
  | 'ERR_PREPARATION_FAILED'
  | 'ERR_PROVIDER_RESPONSE_INVALID'
  | 'ERR_RATE_LIMITED'
  | 'ERR_RESPONSE_INVALID'
  | 'ERR_SCHEMA_UNSUPPORTED'
  | 'ERR_SESSION_BUSY'
  | 'ERR_SESSION_DISPOSED'
  | 'ERR_STEP_LIMIT'
  | 'ERR_TIMEOUT'
  | 'ERR_TOOL_CALL_LIMIT'
  | 'ERR_TOOL_CALL_REPLAY'
  | 'ERR_TOOL_DECISION_FAILED'
  | 'ERR_TOOL_DECISION_INVALID'
  | 'ERR_TOOL_DENIED'
  | 'ERR_TOOL_EVENT_FAILED'
  | 'ERR_TOOL_FAILED'
  | 'ERR_TOOL_UNKNOWN'
  | 'ERR_UNSUPPORTED_FEATURE'
  | 'ERR_UNSUPPORTED_LANGUAGE'
  | 'ERR_UPDATE_FAILED'
  | 'ERR_VALIDATION_RETRIES_EXHAUSTED';

/** A language model failure with a stable machine-readable code. @experimental */
export class LanguageModelError extends Error {
  /** Identifies the failure independently of its human-readable message. */
  readonly code: LanguageModelErrorCode;

  /** @hidden */
  constructor(code: LanguageModelErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'LanguageModelError';
    this.code = code;
  }
}

const nativeCodes: Record<string, LanguageModelErrorCode> = {
  ERR_APP_BACKGROUND: 'ERR_APP_BACKGROUND',
  ERR_REQUEST_CANCELLED: 'ERR_ABORTED',
  ERR_INVALID_ARGUMENT: 'ERR_OPTIONS_INVALID',
  ERR_UNSUPPORTED_OS: 'ERR_MODEL_UNAVAILABLE',
  ERR_TOOL_EXECUTION: 'ERR_TOOL_FAILED',
  ERR_CONTEXT_WINDOW_EXCEEDED: 'ERR_CONTEXT_WINDOW_EXCEEDED',
  ERR_GENERATION_FAILED: 'ERR_GENERATION_FAILED',
  ERR_MODEL_NOT_READY: 'ERR_MODEL_NOT_READY',
  ERR_MODEL_REFUSAL: 'ERR_MODEL_REFUSAL',
  ERR_MODEL_UNAVAILABLE: 'ERR_MODEL_UNAVAILABLE',
  ERR_PREPARATION_FAILED: 'ERR_PREPARATION_FAILED',
  ERR_RATE_LIMITED: 'ERR_RATE_LIMITED',
  ERR_RESPONSE_INVALID: 'ERR_RESPONSE_INVALID',
  ERR_SCHEMA_UNSUPPORTED: 'ERR_SCHEMA_UNSUPPORTED',
  ERR_SESSION_BUSY: 'ERR_SESSION_BUSY',
  ERR_SESSION_DISPOSED: 'ERR_SESSION_DISPOSED',
  ERR_TIMEOUT: 'ERR_TIMEOUT',
  ERR_TOOL_CALL_LIMIT: 'ERR_TOOL_CALL_LIMIT',
  ERR_UNSUPPORTED_FEATURE: 'ERR_UNSUPPORTED_FEATURE',
  ERR_UNSUPPORTED_LANGUAGE: 'ERR_UNSUPPORTED_LANGUAGE',
};

/** @hidden */
export function normalizeError(
  cause: unknown,
  fallback: LanguageModelErrorCode = 'ERR_GENERATION_FAILED',
  message = 'The language model operation failed.'
): LanguageModelError {
  if (cause instanceof LanguageModelError) return cause;
  const error =
    cause !== null && typeof cause === 'object'
      ? (cause as { code?: unknown; message?: unknown })
      : undefined;
  const code =
    typeof error?.code === 'string' && Object.prototype.hasOwnProperty.call(nativeCodes, error.code)
      ? nativeCodes[error.code]!
      : fallback;
  return new LanguageModelError(
    code,
    typeof error?.message === 'string' ? error.message : message,
    { cause }
  );
}

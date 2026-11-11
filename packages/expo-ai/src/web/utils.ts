import { LanguageModelError, type LanguageModelErrorCode } from '../LanguageModelError';
import type { BrowserLanguageModel, BrowserModelOptions } from './BrowserLanguageModel.types';

export function modelOptions(
  inputLanguages: readonly string[],
  outputLanguage: string | null
): BrowserModelOptions {
  return {
    expectedInputs: [
      {
        type: 'text',
        ...(inputLanguages.length && { languages: inputLanguages }),
      },
    ],
    expectedOutputs: [{ type: 'text', ...(outputLanguage && { languages: [outputLanguage] }) }],
  };
}

export function readOptions(json: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(json);
    if (value && typeof value === 'object' && !Array.isArray(value))
      return value as Record<string, unknown>;
  } catch {
    // Use the same public error for invalid JSON and invalid option shapes.
  }
  throw new LanguageModelError('ERR_OPTIONS_INVALID', 'Invalid browser language model options.');
}

export function browserError(cause: unknown, fallback: LanguageModelErrorCode): LanguageModelError {
  if (cause instanceof LanguageModelError) return cause;
  const error = cause as { name?: unknown; message?: unknown } | null;
  let code = fallback;
  switch (error?.name) {
    case 'AbortError':
      code = 'ERR_ABORTED';
      break;
    case 'QuotaExceededError':
      code = 'ERR_CONTEXT_WINDOW_EXCEEDED';
      break;
    case 'SyntaxError':
      code = 'ERR_RESPONSE_INVALID';
      break;
    case 'NotReadableError':
      code = 'ERR_MODEL_REFUSAL';
      break;
    case 'NotSupportedError':
      // Browsers use this for both unsupported schemas and unsupported input/output languages.
      code = 'ERR_UNSUPPORTED_FEATURE';
      break;
    case 'TypeError':
    case 'RangeError':
      code = 'ERR_OPTIONS_INVALID';
      break;
  }
  const message =
    error?.name === 'NotAllowedError'
      ? 'The browser denied model access. Start preparation from a user interaction and check the language-model permissions policy.'
      : typeof error?.message === 'string'
        ? error.message
        : 'The browser language model operation failed.';
  return new LanguageModelError(code, message, { cause });
}

export function destroyModel(model: BrowserLanguageModel | undefined): void {
  try {
    model?.destroy();
  } catch {
    // Cleanup must not replace the generation or preparation failure.
  }
}

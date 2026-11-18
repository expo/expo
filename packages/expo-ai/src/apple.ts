import { createAppleSessionAsync, type AppleGuardrails } from './LanguageModels';
import type { ObjectSchema, SessionOptions } from './LanguageModels.types';
import { appleTools } from './appleTools';

/** Apple Foundation Models guardrail modes. */
export const Guardrails = {
  default: 'default',
  permissiveContentTransformations: 'permissiveContentTransformations',
} as const satisfies Record<string, AppleGuardrails>;

/** Options used to create an Apple Foundation Models session. */
export type AppleSessionOptions<Schemas extends readonly ObjectSchema[] = readonly ObjectSchema[]> =
  SessionOptions<Schemas> & {
    /**
     * `permissiveContentTransformations` skips guardrail checks only for plain string responses.
     * Guided output always uses the default guardrails, and the model can still refuse a request.
     * @default 'default'
     */
    guardrails?: AppleGuardrails;
  };

/**
 * Creates an Apple Foundation Models session.
 * @platform ios 26.0+
 * @platform macos 26.0+
 * @experimental
 */
export function createSessionAsync<const T extends readonly ObjectSchema[]>(
  options: AppleSessionOptions<T> = {}
) {
  return createAppleSessionAsync(options);
}

/**
 * Predefined local image tools. Pass these ordinary tool definitions in tools.
 * Apple Vision reads only labeled images attached to the current request.
 * beforeTool, cancellation, and maximumToolCalls apply to these tools too.
 * @platform ios 26.0+
 * @platform macos 26.0+
 * @experimental
 */
export const Tools = appleTools;

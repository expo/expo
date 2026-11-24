import { LanguageModelError } from './LanguageModelError';
import type { GenerationUsage } from './LanguageModels.types';
import type { NativeSession } from './NativeLanguageModels.types';
import type { Operation } from './Operation';

const unknownUsage = (): GenerationUsage => ({ inputTokens: null, outputTokens: null });
const fields = [
  'inputTokens',
  'outputTokens',
  'cachedInputTokens',
  'reasoningTokens',
  'contextTokens',
] as const;

export function readCompletion(response: unknown): {
  text: string;
  usage: GenerationUsage;
} {
  function invalid(): never {
    throw new LanguageModelError(
      'ERR_PROVIDER_RESPONSE_INVALID',
      'The native provider returned invalid generation metadata.'
    );
  }
  if (typeof response !== 'string') invalid();
  let result: unknown;
  try {
    result = JSON.parse(response);
  } catch {
    invalid();
  }
  if (!result || typeof result !== 'object' || Array.isArray(result)) invalid();
  const { text, usage } = result as Record<string, unknown>;
  if (typeof text !== 'string' || !usage || typeof usage !== 'object' || Array.isArray(usage))
    invalid();
  const record = usage as Record<string, unknown>;
  const counts = unknownUsage();
  for (const key of fields) {
    const value = record[key];
    if (value === undefined && key !== 'inputTokens' && key !== 'outputTokens') continue;
    if (value !== null && (!Number.isSafeInteger(value) || (value as number) < 0)) invalid();
    counts[key] = value as number | null;
  }
  return { text, usage: counts };
}

/** Runs a native generation and validates its result envelope. */
export async function generateNativeCompletion(
  operation: Operation,
  session: NativeSession,
  requestId: string,
  prompt: string,
  options: object
): Promise<{ text: string; usage: GenerationUsage }> {
  const response = await operation.run(() =>
    session.generateAsync(requestId, prompt, JSON.stringify(options))
  );
  return readCompletion(response);
}

/** Sum all reported model calls. A missing measurement never becomes a measured zero. */
export function aggregateUsage(calls: readonly GenerationUsage[]): GenerationUsage {
  const result = unknownUsage();
  for (const key of fields) {
    if (key === 'contextTokens') continue;
    if (calls.length === 0 || !calls.some((call) => key in call)) continue;
    let total: number | null = 0;
    for (const call of calls) {
      const value = call[key];
      if (value == null || !Number.isSafeInteger(total + value)) {
        total = null;
        break;
      }
      total += value;
    }
    result[key] = total;
  }
  const last = calls.at(-1);
  if (last && 'contextTokens' in last) result.contextTokens = last.contextTokens;
  return result;
}

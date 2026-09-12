import { LanguageModelError } from './LanguageModelError';
import type {
  ModelAvailability,
  ModelCapabilities,
  ModelRequirements,
} from './LanguageModels.types';

function invalid(message: string): never {
  throw new LanguageModelError('ERR_PROVIDER_RESPONSE_INVALID', message);
}

/** Unknown progress remains null; providers never invent a percentage. */
export function preparationProgress(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    invalid('Native model preparation progress must be a fraction from 0 to 1, or null.');
  }
  return value;
}

function readCapabilities(value: unknown): ModelCapabilities {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    invalid('The native provider returned invalid capabilities.');
  const record = value as Record<string, unknown>;
  const support = new Set(['supported', 'unsupported', 'unknown']);
  if (
    typeof record.provider !== 'string' ||
    !record.provider.trim() ||
    (record.model !== null && (typeof record.model !== 'string' || !record.model.trim())) ||
    record.execution !== 'on-device' ||
    !['constrainedOutput', 'runtimeToolDeclarations', 'images'].every((key) =>
      support.has(record[key] as string)
    ) ||
    (record.imageTools !== undefined && !support.has(record.imageTools as string)) ||
    (record.contextTokens !== null &&
      (!Number.isSafeInteger(record.contextTokens) || (record.contextTokens as number) <= 0))
  ) {
    invalid('The native provider returned invalid capabilities.');
  }
  return Object.freeze({
    provider: record.provider,
    model: record.model,
    execution: 'on-device',
    constrainedOutput: record.constrainedOutput,
    runtimeToolDeclarations: record.runtimeToolDeclarations,
    images: record.images,
    ...(record.imageTools === undefined ? {} : { imageTools: record.imageTools }),
    contextTokens: record.contextTokens,
  }) as ModelCapabilities;
}

/** Decode the common provider availability envelope. */
export function readAvailability(
  value: unknown,
  requirements: ModelRequirements
): ModelAvailability {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    invalid('Unknown native availability response.');
  const result = value as Record<string, unknown>;
  const capabilities =
    result.capabilities === undefined ? undefined : readCapabilities(result.capabilities);
  // Providers supply capabilities before assets are ready, so an unsupported
  // requirement can reject before an explicit preparation starts a download.
  if (capabilities && requirements.requires?.some((key) => capabilities[key] !== 'supported')) {
    return { status: 'unavailable', reason: 'unsupported-feature' };
  }
  if (result.status === 'unavailable') {
    return {
      status: 'unavailable',
      reason: typeof result.reason === 'string' ? result.reason : 'unknown',
    };
  }
  if (
    result.status === 'not-ready' ||
    result.status === 'downloadable' ||
    result.status === 'downloading'
  ) {
    return { status: result.status, progress: preparationProgress(result.progress) };
  }
  if (result.status !== 'available') invalid('Unknown native availability response.');
  if (!capabilities) invalid('The native provider returned invalid capabilities.');
  if (requirements.requires?.some((key) => capabilities[key] !== 'supported')) {
    return { status: 'unavailable', reason: 'unsupported-feature' };
  }
  return { status: 'available', capabilities };
}

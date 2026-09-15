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
  if (result.status === 'unavailable') {
    return {
      status: 'unavailable',
      reason: typeof result.reason === 'string' ? result.reason : 'unknown',
    };
  }
  // Providers supply capabilities before assets are ready, so an unsupported
  // requirement can reject before an explicit preparation starts a download.
  if (capabilities && requirements.requires?.some((key) => capabilities[key] !== 'supported')) {
    return { status: 'unavailable', reason: 'unsupported-feature' };
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

// A Map rather than an object, because providers send free-form reason strings that would
// otherwise match inherited members such as `constructor`.
const unavailableReasons = new Map<string, string>([
  [
    'module-unavailable',
    'The expo-ai native module is missing from this app. Create a new development build after installing the package.',
  ],
  [
    'unsupported-os-version',
    'This operating system is older than the on-device model requires. Update the device or test on a supported OS version.',
  ],
  [
    'model-unavailable',
    'The device provides no on-device model, or its system configuration is not ready.',
  ],
  [
    'unsupported-feature',
    'The device model does not support a capability this request requires. Remove that capability from the requires list if your app can work without it.',
  ],
  ['language-support-unknown', 'The provider cannot confirm support for the requested languages.'],
  [
    'browser-api-unavailable',
    'This browser does not expose the Prompt API. Use a browser that supports it.',
  ],
  ['browser-model-unavailable', 'This browser exposes the Prompt API but has no model available.'],
]);

/** Explain an unavailability reason, including codes this version does not recognise. */
export function describeUnavailableReason(reason: string): string {
  return unavailableReasons.get(reason) ?? 'The provider did not report a recognised cause.';
}

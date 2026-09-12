import ExpoAI from './ExpoAI';
import { LanguageModelError, normalizeError } from './LanguageModelError';
import { LanguageModelSession } from './LanguageModelSession';
import type {
  ModelAvailability,
  ModelRequirements,
  ObjectSchema,
  SessionOptions,
} from './LanguageModels.types';
import { createOperation, type Operation } from './Operation';
import { preparationProgress, readAvailability } from './availability';
import { observeBackground } from './background';
import { getTools, toolDeclarations } from './tools';

const features = new Set(['constrainedOutput', 'runtimeToolDeclarations', 'images', 'imageTools']);

function validateRequirements(requirements: ModelRequirements) {
  if (
    !requirements ||
    typeof requirements !== 'object' ||
    (requirements.provider !== undefined && requirements.provider !== 'system') ||
    (requirements.inputLanguages !== undefined &&
      (!Array.isArray(requirements.inputLanguages) ||
        requirements.inputLanguages.some(
          (language) => typeof language !== 'string' || !language.trim()
        ))) ||
    (requirements.outputLanguage !== undefined &&
      (typeof requirements.outputLanguage !== 'string' || !requirements.outputLanguage.trim())) ||
    (requirements.requires !== undefined &&
      (!Array.isArray(requirements.requires) ||
        requirements.requires.some((feature) => !features.has(feature))))
  ) {
    throw new LanguageModelError(
      'ERR_OPTIONS_INVALID',
      'Invalid model provider, languages, or feature requirements.'
    );
  }
}

function snapshotRequirements<T extends ModelRequirements>(requirements: T): T {
  validateRequirements(requirements);
  return {
    ...requirements,
    inputLanguages: requirements.inputLanguages ? [...requirements.inputLanguages] : undefined,
    requires: requirements.requires ? [...requirements.requires] : undefined,
  };
}

/**
 * Checks whether the requested system model is ready, without starting a download.
 * Apple Intelligence must be enabled and its system model ready on supported hardware.
 * Availability can change; callers must also handle generation failures.
 * Android requires supported Gemini Nano hardware and ML Kit model readiness.
 * Web support depends on the browser's local Prompt API and model readiness.
 * @platform ios
 * @platform macos
 * @platform android
 * @platform web
 * @experimental
 */
export async function getAvailabilityAsync(
  requirements: ModelRequirements = {}
): Promise<ModelAvailability> {
  requirements = snapshotRequirements(requirements);
  if (!ExpoAI) return { status: 'unavailable', reason: 'module-unavailable' };
  let result: unknown;
  try {
    result = JSON.parse(
      await ExpoAI.getAvailabilityAsync(
        requirements.inputLanguages ?? [],
        requirements.outputLanguage ?? null
      )
    );
  } catch (cause) {
    throw normalizeError(
      cause,
      'ERR_AVAILABILITY_FAILED',
      'Could not read system model availability.'
    );
  }
  return readAvailability(result, requirements);
}

let nextPreparationId = 0;

function removePreparationListener(subscription: { remove(): void } | undefined, failed: boolean) {
  try {
    subscription?.remove();
  } catch (cause) {
    if (!failed) throw normalizeError(cause, 'ERR_PREPARATION_FAILED');
  }
}

/**
 * Explicitly prepares a system model. Android downloads require allowDownload: true
 * and a foreground app. Progress is a fraction from 0 to 1, or null when unknown.
 * Cancellation stops this request's work; it does not remove shared model assets.
 * Apple manages model preparation through system settings; this adapter cannot
 * trigger its download or report progress, even when allowDownload is true.
 * Browser model assets are managed by the browser; Web preparation requires a
 * user gesture when it needs to create the browser model.
 * @platform ios
 * @platform macos
 * @platform android
 * @platform web
 * @experimental
 */
export async function prepareAsync(
  options: ModelRequirements & {
    allowDownload?: boolean;
    signal?: AbortSignal;
    onProgress?: (progress: number | null) => void;
  } = {}
): Promise<ModelAvailability> {
  options = snapshotRequirements(options);
  if (options.allowDownload !== undefined && typeof options.allowDownload !== 'boolean') {
    throw new LanguageModelError('ERR_OPTIONS_INVALID', 'allowDownload must be a boolean.');
  }
  if (options.onProgress !== undefined && typeof options.onProgress !== 'function') {
    throw new LanguageModelError('ERR_OPTIONS_INVALID', 'onProgress must be a function.');
  }
  const operation = createOperation(options.signal);
  let subscription: { remove(): void } | undefined;
  let backgroundSubscription: { remove(): void } | undefined;
  const requestId = `preparation-${++nextPreparationId}`;
  const nativeModule = ExpoAI;
  let dispatched = false;
  let settled = false;
  let failed = false;
  const progressTasks: Promise<void>[] = [];
  const cancel = () => {
    if (dispatched && !settled) {
      try {
        nativeModule?.cancelPreparation?.(requestId);
      } catch {
        // Preserve the cancellation or callback error while cleaning up listeners.
      }
    }
  };
  try {
    backgroundSubscription = observeBackground(operation);
    const availability = await operation.run(() => getAvailabilityAsync(options));
    if (
      availability.status === 'available' ||
      availability.status === 'unavailable' ||
      !options.allowDownload ||
      !nativeModule?.prepareAsync
    )
      return availability;
    if (!nativeModule.cancelPreparation || !nativeModule.addListener) {
      throw new LanguageModelError(
        'ERR_PROVIDER_RESPONSE_INVALID',
        'The native preparation bridge is incomplete.'
      );
    }
    operation.signal.addEventListener('abort', cancel, { once: true });
    subscription = nativeModule.addListener('onPreparationProgress', (event) => {
      if (event.requestId !== requestId || operation.signal.aborted || settled) return;
      const task = operation
        .run(() => {
          const progress = preparationProgress(event.progress);
          try {
            return Promise.resolve(options.onProgress?.(progress)).catch((cause) => {
              throw new LanguageModelError(
                'ERR_PREPARATION_FAILED',
                'The onProgress callback failed.',
                { cause }
              );
            });
          } catch (cause) {
            throw new LanguageModelError(
              'ERR_PREPARATION_FAILED',
              'The onProgress callback failed.',
              { cause }
            );
          }
        })
        .catch((cause) => {
          operation.abort(normalizeError(cause, 'ERR_PREPARATION_FAILED'));
        });
      progressTasks.push(task);
    });
    const response = await operation.run(() => {
      dispatched = true;
      return nativeModule.prepareAsync!(
        requestId,
        true,
        options.inputLanguages ?? [],
        options.outputLanguage ?? null
      );
    });
    settled = true;
    await operation.run(() => Promise.all(progressTasks));
    let result: unknown;
    try {
      result = JSON.parse(response);
    } catch (cause) {
      throw new LanguageModelError(
        'ERR_PROVIDER_RESPONSE_INVALID',
        'Invalid native preparation response.',
        { cause }
      );
    }
    return readAvailability(result, options);
  } catch (cause) {
    failed = true;
    operation.check();
    throw normalizeError(cause, 'ERR_PREPARATION_FAILED', 'Could not prepare the system model.');
  } finally {
    settled = true;
    operation.signal.removeEventListener('abort', cancel);
    operation.close();
    try {
      removePreparationListener(subscription, failed);
    } finally {
      removePreparationListener(backgroundSubscription, failed);
    }
  }
}

/**
 * Creates a session using the on-device system model. Rejects when the
 * requirements are unmet. Does not request model preparation or select a cloud
 * provider. On Web, browser-managed assets can change after the readiness check.
 * Tools use native orchestration when supported, otherwise a bounded library loop.
 * @platform ios 26.0+
 * @platform macos 26.0+
 * @platform android
 * @platform web
 * @experimental
 */
export async function createSessionAsync<const T extends readonly ObjectSchema[]>(
  options: SessionOptions<T> = {}
): Promise<LanguageModelSession> {
  try {
    return await openSessionAsync(options);
  } catch (cause) {
    throw normalizeError(cause);
  }
}

/** Internal preparation used by a one-shot owner, including its readiness cancellation. */
export async function createOwnedSessionAsync(options: SessionOptions, operation: Operation) {
  operation.check();
  return openSessionAsync(options, operation);
}

async function openSessionAsync(
  options: SessionOptions,
  operation?: Operation
): Promise<LanguageModelSession> {
  options = snapshotRequirements(options);
  const keys = new Set([
    'provider',
    'inputLanguages',
    'outputLanguage',
    'requires',
    'instructions',
    'tools',
  ]);
  for (const key of Object.keys(options)) {
    if (!keys.has(key))
      throw new LanguageModelError('ERR_OPTIONS_INVALID', `Unknown session option: ${key}.`);
  }
  if (options.instructions !== undefined && typeof options.instructions !== 'string') {
    throw new LanguageModelError('ERR_OPTIONS_INVALID', 'Session instructions must be a string.');
  }
  const tools = getTools(options.tools);
  const availability = await getAvailabilityAsync(options);
  operation?.check();
  if (availability.status !== 'available' || !ExpoAI) {
    throw new LanguageModelError(
      availability.status === 'not-ready' ||
        availability.status === 'downloadable' ||
        availability.status === 'downloading'
        ? 'ERR_MODEL_NOT_READY'
        : 'ERR_MODEL_UNAVAILABLE',
      availability.status === 'unavailable'
        ? `The requested system language model is unavailable: ${availability.reason}.`
        : 'The requested system language model is not ready.'
    );
  }
  const nativeModule = ExpoAI;
  if (
    tools.some((tool) => tool.builtin) &&
    (availability.capabilities.imageTools !== 'supported' ||
      availability.capabilities.runtimeToolDeclarations !== 'supported')
  ) {
    throw new LanguageModelError(
      'ERR_UNSUPPORTED_FEATURE',
      'Apple image tools are not supported by this provider.'
    );
  }
  const sessionOptions = {
    instructions: options.instructions,
    ...(nativeModule.supportsSessionLanguages
      ? {
          inputLanguages: options.inputLanguages,
          outputLanguage: options.outputLanguage,
        }
      : {}),
  };
  const rawOptions = JSON.stringify({ ...sessionOptions, tools: [] });
  const factory = (withTools = false) =>
    nativeModule.createSessionAsync(
      withTools ? JSON.stringify({ ...sessionOptions, tools: toolDeclarations(tools) }) : rawOptions
    );
  const native = await nativeModule.createSessionAsync(
    JSON.stringify({
      ...sessionOptions,
      tools:
        availability.capabilities.runtimeToolDeclarations === 'supported'
          ? toolDeclarations(tools)
          : [],
    })
  );
  return new LanguageModelSession(native, factory, tools, availability.capabilities);
}

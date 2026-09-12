import { LanguageModelError } from '../LanguageModelError';
import type { NativeLanguageModels, NativePreparationEvent } from '../NativeLanguageModels.types';
import { createOperation, type Operation } from '../Operation';
import type {
  BrowserLanguageModelAPI,
  BrowserLanguageModel,
  BrowserModelOptions,
} from './BrowserLanguageModel.types';
import { BrowserLanguageModelSession } from './BrowserLanguageModelSession';
import { browserError, destroyModel, modelOptions, readOptions } from './utils';

const capabilities = {
  provider: 'browser-prompt-api',
  model: null,
  execution: 'on-device',
  constrainedOutput: 'supported',
  runtimeToolDeclarations: 'unsupported',
  images: 'unsupported',
  contextTokens: null,
};

function getAPI(): BrowserLanguageModelAPI | undefined {
  if (typeof globalThis.window === 'undefined' || globalThis.isSecureContext === false)
    return undefined;
  const api = (
    globalThis as typeof globalThis & {
      LanguageModel?: BrowserLanguageModelAPI;
    }
  ).LanguageModel;
  return typeof api?.availability === 'function' && typeof api.create === 'function'
    ? api
    : undefined;
}

async function availability(
  api: BrowserLanguageModelAPI | undefined,
  options: BrowserModelOptions
) {
  if (!api)
    return {
      status: 'unavailable',
      reason: 'browser-api-unavailable',
      capabilities,
    } as const;
  const status = await api.availability(options);
  if (!['available', 'downloadable', 'downloading', 'unavailable'].includes(status)) {
    throw new LanguageModelError(
      'ERR_PROVIDER_RESPONSE_INVALID',
      'The browser returned unknown model readiness.'
    );
  }
  return status === 'unavailable'
    ? { status, reason: 'browser-model-unavailable', capabilities }
    : { status, progress: null, capabilities };
}

export class BrowserLanguageModels implements NativeLanguageModels {
  readonly supportsSessionLanguages = true;
  private preparations = new Map<string, Operation>();
  private listeners = new Map<string, Set<(event: never) => void>>();

  addListener(event: string, listener: (event: never) => void) {
    const listeners = this.listeners.get(event) ?? new Set();
    listeners.add(listener);
    this.listeners.set(event, listeners);
    return {
      remove: () => {
        listeners.delete(listener);
      },
    };
  }

  async getAvailabilityAsync(
    inputLanguages: readonly string[],
    outputLanguage: string | null
  ): Promise<string> {
    try {
      return JSON.stringify(
        await availability(getAPI(), modelOptions(inputLanguages, outputLanguage))
      );
    } catch (cause) {
      throw browserError(cause, 'ERR_AVAILABILITY_FAILED');
    }
  }

  async prepareAsync(
    requestId: string,
    allowDownload: boolean,
    inputLanguages: readonly string[],
    outputLanguage: string | null
  ): Promise<string> {
    const operation = createOperation();
    this.preparations.set(requestId, operation);
    const options = modelOptions(inputLanguages, outputLanguage);
    try {
      const api = getAPI();
      const result = await operation.run(() => availability(api, options));
      if (!api || !allowDownload || !['downloadable', 'downloading'].includes(result.status))
        return JSON.stringify(result);
      const model = await operation.run(() =>
        api
          .create({
            ...options,
            signal: operation.signal,
            monitor: (monitor) =>
              monitor.addEventListener('downloadprogress', (event) => {
                if (operation.signal.aborted || this.preparations.get(requestId) !== operation)
                  return;
                const progress =
                  event.lengthComputable && event.total > 0 ? event.loaded / event.total : null;
                const update: NativePreparationEvent = { requestId, progress };
                this.listeners
                  .get('onPreparationProgress')
                  ?.forEach((listener) => listener(update as never));
              }),
          })
          .then((model) => {
            if (operation.signal.aborted) destroyModel(model);
            return model;
          })
      );
      destroyModel(model);
      return JSON.stringify(await operation.run(() => availability(api, options)));
    } catch (cause) {
      const error = browserError(cause, 'ERR_PREPARATION_FAILED');
      operation.abort(error);
      throw error;
    } finally {
      this.preparations.delete(requestId);
      operation.close();
    }
  }

  cancelPreparation(requestId: string): void {
    this.preparations.get(requestId)?.abort();
  }

  async createSessionAsync(optionsJSON: string): Promise<BrowserLanguageModelSession> {
    const value = readOptions(optionsJSON);
    if (value.tools !== undefined && (!Array.isArray(value.tools) || value.tools.length > 0)) {
      throw new LanguageModelError(
        'ERR_UNSUPPORTED_FEATURE',
        'The browser adapter does not support native tool declarations.'
      );
    }
    const options = modelOptions(
      (value.inputLanguages as readonly string[]) ?? [],
      (value.outputLanguage as string) ?? null
    );
    const api = getAPI();
    const result = await availability(api, options);
    if (!api || result.status === 'unavailable')
      throw new LanguageModelError('ERR_MODEL_UNAVAILABLE', 'The browser model is unavailable.');
    if (result.status !== 'available')
      throw new LanguageModelError(
        'ERR_MODEL_NOT_READY',
        'Prepare the browser model before creating a session.'
      );
    const operation = createOperation();
    let opening = true;
    let openedModel: BrowserLanguageModel | undefined;
    const readinessChecks: Promise<void>[] = [];
    try {
      const model = await operation.run(() =>
        api
          .create({
            ...options,
            ...(typeof value.instructions === 'string' && {
              initialPrompts: [{ role: 'system', content: value.instructions }],
            }),
            signal: operation.signal,
            monitor: (monitor) =>
              monitor.addEventListener('downloadprogress', (event) => {
                if (
                  !opening ||
                  operation.signal.aborted ||
                  (event.lengthComputable && event.loaded >= event.total)
                )
                  return;
                // Ready models also emit synthetic 0/1 progress. Recheck before treating it as a download.
                readinessChecks.push(
                  availability(api, options)
                    .then((current) => {
                      if (current.status !== 'available')
                        operation.abort(
                          new LanguageModelError(
                            'ERR_MODEL_NOT_READY',
                            'The browser model now needs preparation.'
                          )
                        );
                    })
                    .catch((cause) =>
                      operation.abort(browserError(cause, 'ERR_AVAILABILITY_FAILED'))
                    )
                );
              }),
          })
          .then((model) => {
            if (operation.signal.aborted) destroyModel(model);
            else openedModel = model;
            return model;
          })
      );
      opening = false;
      await operation.run(() => Promise.all(readinessChecks));
      if (
        ![
          'prompt',
          'promptStreaming',
          'clone',
          'destroy',
          'addEventListener',
          'removeEventListener',
        ].every((key) => typeof model[key as keyof typeof model] === 'function')
      ) {
        destroyModel(model);
        throw new LanguageModelError(
          'ERR_UNSUPPORTED_FEATURE',
          'The browser does not implement the required Prompt API session methods.'
        );
      }
      return new BrowserLanguageModelSession(model);
    } catch (cause) {
      const error = browserError(cause, 'ERR_GENERATION_FAILED');
      operation.abort(error);
      destroyModel(openedModel);
      throw error;
    } finally {
      opening = false;
      operation.close();
    }
  }
}

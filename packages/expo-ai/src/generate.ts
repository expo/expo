import { LanguageModelError, normalizeError } from './LanguageModelError';
import {
  type LanguageModelSession,
  type InternalRequestOptions,
  validateRequestOptions,
} from './LanguageModelSession';
import { createOwnedSessionAsync } from './LanguageModels';
import type {
  GenerateOptions,
  GenerationResult,
  InferSchema,
  ModelSchema,
  ObjectSchema,
  SessionOptions,
  StructuredGenerateOptions,
} from './LanguageModels.types';
import { createOperation } from './Operation';
import { observeBackground } from './background';
import { runCleanup } from './cleanup';
import { snapshotImages } from './images';
import { compileSchema } from './schema';

type Options = SessionOptions & InternalRequestOptions & Pick<GenerateOptions, 'onUpdate'>;

function disposeOwnedSession(
  session: LanguageModelSession | undefined,
  taskFailed: boolean,
  backgroundSubscription?: { remove(): void }
) {
  runCleanup([() => session?.dispose(), () => backgroundSubscription?.remove()], taskFailed);
}

/**
 * Performs one independent task and validates the result against a schema.
 * Uses native constrained output when available, otherwise validates generated
 * output with bounded repair attempts. Provider failures do not trigger fallback.
 * @platform ios 26.0+
 * @platform macos 26.0+
 * @platform android
 * @platform web
 * @experimental
 */
export function generateAsync<const S extends ModelSchema, const T extends readonly ObjectSchema[]>(
  input: string,
  options: StructuredGenerateOptions<S, T>
): Promise<GenerationResult<InferSchema<S>>>;
/**
 * Performs one independent local model task. Availability checks are optional;
 * an unready model rejects without requesting preparation.
 * The temporary session is disposed on success, failure, or cancellation.
 * @platform ios 26.0+
 * @platform macos 26.0+
 * @platform android
 * @platform web
 * @experimental
 */
export function generateAsync<const T extends readonly ObjectSchema[]>(
  input: string,
  options?: GenerateOptions<T>
): Promise<GenerationResult<string>>;
export async function generateAsync(
  input: string,
  options: Options = {}
): Promise<GenerationResult<unknown>> {
  if (
    typeof input !== 'string' ||
    !options ||
    typeof options !== 'object' ||
    Array.isArray(options)
  ) {
    throw new LanguageModelError(
      'ERR_OPTIONS_INVALID',
      'A string input and task options are required.'
    );
  }
  const {
    provider,
    inputLanguages,
    outputLanguage,
    requires,
    instructions,
    tools,
    onUpdate,
    ...request
  } = options;
  if (onUpdate !== undefined && typeof onUpdate !== 'function') {
    throw new LanguageModelError('ERR_OPTIONS_INVALID', 'onUpdate must be a function.');
  }
  validateRequestOptions(request);
  request.images = snapshotImages(request.images);
  if (request.schema !== undefined) request.schema = compileSchema(request.schema);
  const operation = createOperation(request.signal, request.timeoutMs);
  let owned: LanguageModelSession | undefined;
  let failed = false;
  let backgroundSubscription: { remove(): void } | undefined;
  try {
    backgroundSubscription = observeBackground(operation);
    operation.check();
    // This starts synchronously so session options and tool definitions are snapshotted
    // before the caller can mutate them while availability is being checked.
    const opening = createOwnedSessionAsync(
      {
        provider,
        inputLanguages,
        outputLanguage,
        requires,
        instructions,
        tools,
      },
      operation
    ).then((session) => {
      if (operation.signal.aborted) {
        session.dispose();
        operation.check();
      }
      owned = session;
      return session;
    });
    // Cancellation may win before operation.run invokes its callback.
    opening.catch(() => {});
    const session = await operation.run(() => opening);
    // The outer operation owns the whole-task deadline, including session creation.
    const sessionRequest = {
      ...request,
      signal: operation.signal,
      timeoutMs: undefined,
    };
    if (!onUpdate) {
      return await operation.run(() => session.generateAsync(input, sessionRequest as never));
    }
    return await operation.run(async () => {
      for await (const event of session.generateStream(input, sessionRequest as never)) {
        operation.check();
        if (event.type === 'text') {
          try {
            await operation.run(() => onUpdate({ text: event.text }));
          } catch (cause) {
            operation.check();
            throw new LanguageModelError('ERR_UPDATE_FAILED', 'The onUpdate callback failed.', {
              cause,
            });
          }
        } else if (event.type === 'result') {
          return event.result;
        }
      }
      throw new LanguageModelError(
        'ERR_PROVIDER_RESPONSE_INVALID',
        'The provider ended without a result.'
      );
    });
  } catch (cause) {
    failed = true;
    operation.check();
    throw normalizeError(cause);
  } finally {
    operation.close();
    disposeOwnedSession(owned, failed, backgroundSubscription);
  }
}

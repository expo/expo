import { LanguageModelError } from './LanguageModelError';

/** One deadline and cancellation signal shared by every step of a request. */
export function createOperation(external?: AbortSignal, timeoutMs?: number) {
  if (
    timeoutMs !== undefined &&
    (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 2_147_483_647)
  ) {
    throw new LanguageModelError(
      'ERR_OPTIONS_INVALID',
      'timeoutMs must be an integer from 1 through 2147483647.'
    );
  }
  if (
    external !== undefined &&
    (external === null ||
      typeof external.aborted !== 'boolean' ||
      typeof external.addEventListener !== 'function' ||
      typeof external.removeEventListener !== 'function')
  ) {
    throw new LanguageModelError('ERR_OPTIONS_INVALID', 'signal must be an AbortSignal.');
  }

  const controller = new AbortController();
  const signal = controller.signal;
  const deadline = timeoutMs === undefined ? Infinity : performance.now() + timeoutMs;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let closed = false;
  let pending = 0;
  // React Native's AbortController can omit signal.reason and ignore abort(reason).
  // Keep the operation's error independently of that optional platform feature.
  let abortError: Error | undefined;
  const timeoutError = () =>
    new LanguageModelError('ERR_TIMEOUT', 'The operation deadline expired.');
  const closedError = () => new LanguageModelError('ERR_ABORTED', 'The operation is closed.');

  function detach() {
    if (timer !== undefined) clearTimeout(timer);
    external?.removeEventListener('abort', onExternalAbort);
  }
  function abortWithError(error: Error) {
    if (!signal.aborted) {
      abortError = error;
      detach();
      controller.abort(error);
    }
  }
  function onExternalAbort() {
    abortWithError(
      new LanguageModelError('ERR_ABORTED', 'The operation was canceled.', {
        cause: external?.reason,
      })
    );
  }
  function check() {
    if (signal.aborted) throw abortError;
    if (closed) throw closedError();
    // A timer cannot run while synchronous work or promise microtasks hold the event loop.
    if (performance.now() >= deadline) {
      abortWithError(timeoutError());
      throw abortError;
    }
  }

  if (external?.aborted) onExternalAbort();
  else {
    external?.addEventListener('abort', onExternalAbort, { once: true });
    if (timeoutMs !== undefined)
      timer = setTimeout(() => abortWithError(timeoutError()), timeoutMs);
  }

  return {
    signal,
    check,
    async run<T>(work: () => Promise<T> | T): Promise<T> {
      check();
      if (typeof work !== 'function') {
        throw new LanguageModelError('ERR_OPTIONS_INVALID', 'Operation work must be a function.');
      }
      pending++;
      let onAbort!: () => void;
      const aborted = new Promise<never>((_, reject) => {
        onAbort = () => reject(abortError);
        signal.addEventListener('abort', onAbort, { once: true });
      });
      try {
        const result = await Promise.race([
          Promise.resolve().then(() => {
            check();
            return work();
          }),
          aborted,
        ]);
        check();
        return result;
      } catch (error) {
        check();
        throw error;
      } finally {
        pending--;
        signal.removeEventListener('abort', onAbort);
      }
    },
    abort(reason?: Error) {
      abortWithError(
        reason instanceof LanguageModelError
          ? reason
          : new LanguageModelError('ERR_ABORTED', 'The operation was canceled.', { cause: reason })
      );
    },
    close() {
      if (closed) return;
      if (pending > 0) abortWithError(closedError());
      closed = true;
      detach();
    },
  };
}

export type Operation = ReturnType<typeof createOperation>;

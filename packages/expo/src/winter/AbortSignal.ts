type AbortSignalConstructor = typeof AbortSignal;

const MAX_TIMEOUT = Number.MAX_SAFE_INTEGER;
const MAX_TIMER_DELAY = 2 ** 31 - 1;

export function installAbortSignalPatch(
  abortSignal: AbortSignalConstructor
): AbortSignalConstructor {
  if (abortSignal.timeout == null) {
    defineAbortSignalStatic(abortSignal, 'timeout', timeout);
  }
  if (abortSignal.any == null) {
    defineAbortSignalStatic(abortSignal, 'any', any);
  }

  return abortSignal;
}

function timeout(milliseconds: number): AbortSignal {
  validateTimeout(milliseconds);

  const controller = new AbortController();
  const reason = new DOMException('The signal timed out.', 'TimeoutError');
  let remaining = milliseconds;

  const schedule = () => {
    const delay = Math.min(remaining, MAX_TIMER_DELAY);
    remaining -= delay;
    setTimeout(() => {
      if (remaining > 0) {
        schedule();
      } else {
        abortWithReason(controller, reason);
      }
    }, delay);
  };

  schedule();

  return controller.signal;
}

function any(signals: Iterable<AbortSignal>): AbortSignal {
  if (signals == null || typeof signals[Symbol.iterator] !== 'function') {
    throw new TypeError('AbortSignal.any requires an iterable.');
  }

  const signalList = Array.from(signals);
  const controller = new AbortController();
  const cleanupFunctions: (() => void)[] = [];

  for (const signal of signalList) {
    validateAbortSignal(signal);

    if (signal.aborted) {
      abortWithReason(controller, getAbortReason(signal));
      return controller.signal;
    }
  }

  const abort = (signal: AbortSignal) => {
    cleanupFunctions.forEach((cleanup) => cleanup());
    abortWithReason(controller, getAbortReason(signal));
  };

  for (const signal of signalList) {
    const listener = () => {
      abort(signal);
    };
    signal.addEventListener('abort', listener);
    cleanupFunctions.push(() => {
      signal.removeEventListener('abort', listener);
    });
  }

  return controller.signal;
}

function validateTimeout(milliseconds: number): void {
  if (typeof milliseconds !== 'number') {
    throw new TypeError('AbortSignal.timeout requires a number.');
  }
  if (!Number.isInteger(milliseconds) || milliseconds < 0 || milliseconds > MAX_TIMEOUT) {
    throw new RangeError(
      `AbortSignal.timeout requires a timeout between 0 and ${MAX_TIMEOUT} milliseconds.`
    );
  }
}

function validateAbortSignal(signal: AbortSignal): void {
  if (
    signal == null ||
    typeof signal !== 'object' ||
    typeof signal.aborted !== 'boolean' ||
    typeof signal.addEventListener !== 'function' ||
    typeof signal.removeEventListener !== 'function'
  ) {
    throw new TypeError('AbortSignal.any requires every item to be an AbortSignal.');
  }
}

function getAbortReason(signal: AbortSignal): unknown {
  return 'reason' in signal
    ? signal.reason
    : new DOMException('The operation was aborted.', 'AbortError');
}

function abortWithReason(controller: AbortController, reason: unknown): void {
  controller.abort(reason);

  if (controller.signal.reason !== reason) {
    try {
      Object.defineProperty(controller.signal, 'reason', {
        value: reason,
        configurable: true,
      });
    } catch {}
  }
}

function defineAbortSignalStatic(
  abortSignal: AbortSignalConstructor,
  name: 'timeout' | 'any',
  value: AbortSignalConstructor[typeof name]
): void {
  Object.defineProperty(abortSignal, name, {
    value,
    configurable: true,
    enumerable: false,
    writable: true,
  });
}

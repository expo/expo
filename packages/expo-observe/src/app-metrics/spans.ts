import { SharedObject } from 'expo';

import type { Span } from './Span';
import AppMetricsModule from './module';
import type { RecordSpanOptions, SpanEndOptions, StartSpanOptions } from './types';

/**
 * A span that records nothing. `startSpan` returns it when the native module can't start a span,
 * so the caller's code keeps working. W3C Trace Context reserves all-zero ids as invalid.
 */
class InertSpan extends SharedObject {
  readonly traceId = '0'.repeat(32);
  readonly spanId = '0'.repeat(16);

  setAttributes() {}
  addEvent() {}
  end() {}
}

/**
 * Starts a trace span measuring an operation that is underway, and returns a handle to finish
 * it. The span's identity (trace and span ids) is assigned immediately, so other spans can be
 * started with this one as `parent` before it ends. Nothing is persisted until `end()`.
 *
 * The span is attributed to the current main session and exported to EAS Observe with the next
 * dispatch after it ends. Starting a span never throws: when the span can't be recorded, a warning
 * is logged and the returned span still accepts every call.
 *
 * @param name Short, stable identifier for the operation being measured, like `'checkout'`.
 * Must be non-empty, must not start with the reserved `expo.` prefix, and must be 256 characters
 * or fewer. Otherwise the span is not recorded.
 * @param options Initial attributes, an explicit parent, and an optional start-time override.
 *
 * @example
 * ```ts
 * import { startSpan } from 'expo-app-metrics';
 *
 * const span = startSpan('checkout', { attributes: { 'cart.items': 3 } });
 * span.addEvent('cart-validated');
 * span.end();
 * ```
 */
export function startSpan(name: string, options?: StartSpanOptions): Span {
  try {
    const { parent, ...nativeOptions } = options ?? {};
    return AppMetricsModule.startSpan(name, nativeOptions, parent ?? undefined);
  } catch (error) {
    console.warn(
      '[expo-app-metrics] startSpan could not start the span, so it is not recorded:',
      error
    );
    return new InertSpan();
  }
}

/**
 * Runs `callback` inside a span: the span starts before the callback and ends when it settles.
 * A thrown error or rejected promise ends the span with an `'error'` status carrying the
 * error's message, and is then rethrown, so the caller's own error handling is unaffected. A
 * failure inside the SDK never changes the outcome: the returned promise settles like the
 * callback.
 *
 * The callback receives the span, both to enrich it (attributes, events) and to pass it as
 * `parent` to nested spans. There is no implicit parenting: a span started inside the callback
 * without an explicit `parent` begins its own trace.
 *
 * @param name Short, stable identifier for the operation being measured. Must be non-empty, must
 * not start with the reserved `expo.` prefix, and must be 256 characters or fewer. Otherwise the
 * callback still runs, but the span is not recorded.
 * @param callback The operation to measure. May be synchronous or asynchronous.
 * @param options Initial attributes, an explicit parent, and an optional start-time override.
 * @return A promise that resolves to the callback's own result.
 *
 * @example
 * ```ts
 * import { withSpan } from 'expo-app-metrics';
 *
 * const receipt = await withSpan('checkout', async (span) => {
 *   await validateCart();
 *   span.addEvent('cart-validated');
 *   return submitOrder();
 * });
 * ```
 */
export async function withSpan<T>(
  name: string,
  callback: (span: Span) => T | Promise<T>,
  options?: StartSpanOptions
): Promise<T> {
  const span = startSpan(name, options);
  let result: T;
  try {
    result = await callback(span);
  } catch (error) {
    // Reading a message off an arbitrary throwable can itself throw (a getter that throws, an
    // exotic object). The span still has to end, and the caller still has to see their own error.
    let message: string | undefined;
    try {
      message = error instanceof Error ? error.message : String(error);
    } catch {}
    endSpanQuietly(span, { status: 'error', message });
    throw error;
  }
  endSpanQuietly(span);
  return result;
}

/**
 * Ends a span for `withSpan`. A failure here is a telemetry problem, so it is logged instead of
 * changing the outcome of the caller's operation.
 */
function endSpanQuietly(span: Span, options?: SpanEndOptions): void {
  try {
    if (options === undefined) {
      span.end();
    } else {
      span.end(options);
    }
  } catch (error) {
    console.warn('[expo-app-metrics] withSpan could not end the span:', error);
  }
}

/**
 * Records a span for an operation that was already measured, in one call. Equivalent to
 * `startSpan` immediately followed by `end` with explicit timestamps. Use it when the start
 * and end times come from your own measurement.
 *
 * When either time is missing or isn't a unix-epoch timestamp in milliseconds (a value from
 * `performance.now()`, or one in seconds or microseconds), or when `endTime` is before
 * `startTime`, the span is not recorded and a warning is logged. Recording a span never throws.
 *
 * @param name Short, stable identifier for the operation being measured. Must be non-empty, must
 * not start with the reserved `expo.` prefix, and must be 256 characters or fewer. Otherwise the
 * span is not recorded.
 * @param options The measured window (`startTime` and `endTime`, unix-epoch milliseconds; both
 * required), optional attributes, and an optional parent.
 *
 * @example
 * ```ts
 * import { recordSpan } from 'expo-app-metrics';
 *
 * const startTime = Date.now();
 * decodeImage();
 * recordSpan('image-decode', { startTime, endTime: Date.now() });
 * ```
 */
export function recordSpan(name: string, options: RecordSpanOptions): void {
  try {
    const { parent, ...nativeOptions } = options;
    AppMetricsModule.recordSpan(name, nativeOptions, parent ?? undefined);
  } catch (error) {
    console.warn('[expo-app-metrics] recordSpan could not record the span:', error);
  }
}

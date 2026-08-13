import type { Span } from './Span';
import AppMetricsModule from './module';
import type { RecordSpanOptions, StartSpanOptions } from './types';

/**
 * Starts a trace span measuring an operation that is underway, and returns a handle to finish
 * it. The span's identity (trace and span ids) is assigned immediately, so other spans can be
 * started with this one as `parent` before it ends. Nothing is persisted until `end()`.
 *
 * The span is attributed to the current main session and exported to EAS Observe with the next
 * dispatch after it ends.
 *
 * @param name Short, stable identifier for the operation being measured, like `'checkout'`.
 * Must be non-empty.
 * @param options Initial attributes, an explicit parent, and an optional start-time override.
 *
 * @example
 * ```ts
 * const span = AppMetrics.startSpan('checkout', { attributes: { 'cart.items': 3 } });
 * span.addEvent('cart-validated');
 * span.end();
 * ```
 */
export function startSpan(name: string, options?: StartSpanOptions): Span {
  const { parent, ...nativeOptions } = options ?? {};
  return AppMetricsModule.startSpan(name, nativeOptions, parent ?? undefined);
}

/**
 * Runs `callback` inside a span: the span starts before the callback and ends when it settles.
 * A thrown error or rejected promise ends the span with an `'error'` status carrying the
 * error's message, and is then rethrown, so the caller's own error handling is unaffected.
 *
 * The callback receives the span, both to enrich it (attributes, events) and to pass it as
 * `parent` to nested spans. There is no implicit parenting: a span started inside the callback
 * without an explicit `parent` begins its own trace.
 *
 * @param name Short, stable identifier for the operation being measured. Must be non-empty.
 * @param callback The operation to measure. May be synchronous or asynchronous.
 * @param options Initial attributes, an explicit parent, and an optional start-time override.
 * @return A promise that resolves to the callback's own result.
 *
 * @example
 * ```ts
 * const receipt = await AppMetrics.withSpan('checkout', async (span) => {
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
  try {
    const result = await callback(span);
    span.end();
    return result;
  } catch (error) {
    span.end({
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Records a span for an operation that was already measured, in one call. Equivalent to
 * `startSpan` immediately followed by `end` with explicit timestamps — use it when the start
 * and end times come from your own measurement.
 *
 * @param name Short, stable identifier for the operation being measured. Must be non-empty.
 * @param options The measured window (`startTime` and `endTime`, unix-epoch milliseconds; both
 * required) and optional attributes.
 *
 * @example
 * ```ts
 * const startTime = Date.now();
 * decodeImage();
 * AppMetrics.recordSpan('image-decode', { startTime, endTime: Date.now() });
 * ```
 */
export function recordSpan(name: string, options: RecordSpanOptions): void {
  AppMetricsModule.recordSpan(name, options);
}

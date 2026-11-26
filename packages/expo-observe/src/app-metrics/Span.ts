import type { SharedObject } from 'expo';

import type { LogAttributeValue, SpanEndOptions, SpanEventOptions } from './types';

/**
 * Represents an operation that you measure. `startSpan` returns a span, and `withSpan` passes one
 * to its callback. While the operation runs, the span collects attributes and events. Pass the
 * span as `parent` to start a nested span.
 *
 * Calling `end()` saves the span. If you never call `end()`, Observe never sends the span.
 */
export declare class Span extends SharedObject {
  /**
   * Trace ID, as 32 lowercase hexadecimal characters. Spans that you start with this span as
   * `parent` share it.
   */
  readonly traceId: string;
  /**
   * Span ID, as 16 lowercase hexadecimal characters
   */
  readonly spanId: string;
  /**
   * Adds attributes to the span. Setting a key again replaces its value. Attributes go through the
   * same validation as `logEvent` attributes: Observe drops empty keys and keys in the reserved
   * `expo.*` namespace, and logs a warning.
   *
   * Has no effect after `end()`.
   *
   * @param attributes Attribute names mapped to values. A value can be a string, number, boolean,
   * array, or nested object.
   *
   * @example
   * ```ts
   * span.setAttributes({ 'cart.items': 3, 'payment.method': 'card' });
   * ```
   */
  setAttributes(attributes: Record<string, LogAttributeValue>): void;
  /**
   * Adds a point-in-time event to the span, such as a checkpoint inside the measured operation.
   * Observe drops the event and logs a warning when its name is empty, starts with the reserved
   * `expo.` prefix, or is longer than 256 characters. At most 32 events of a span reach the
   * server.
   *
   * Has no effect after `end()`.
   *
   * @param name The event name, for example, `'cart-validated'`
   * @param options Event attributes and an optional event time
   *
   * @example
   * ```ts
   * span.addEvent('cart-validated', { attributes: { 'cart.items': 3 } });
   * ```
   */
  addEvent(name: string, options?: SpanEventOptions): void;
  /**
   * Ends the span and saves it. Observe sends the span with the next dispatch. Only the first call
   * has an effect. Later calls log a warning and do nothing.
   *
   * @param options An optional status, an error message for the `'error'` status, and an optional
   * end time
   *
   * @example
   * ```ts
   * try {
   *   await submitOrder();
   *   span.end();
   * } catch (error) {
   *   span.end({ status: 'error', message: String(error) });
   *   throw error;
   * }
   * ```
   */
  end(options?: SpanEndOptions): void;
}

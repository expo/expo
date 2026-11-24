import type { SharedObject } from 'expo';

import type { LogAttributeValue, SpanEndOptions, SpanEventOptions } from './types';

/**
 * An operation that is being measured, as returned by `startSpan` or passed to the `withSpan`
 * callback. While the operation runs, the span collects attributes and events. Pass the span as
 * `parent` to start a nested span.
 *
 * The span is saved only when `end()` is called. A span that is never ended is not sent.
 */
export declare class Span extends SharedObject {
  /**
   * W3C trace id (32 lowercase hex characters) assigned when the span started. Spans started
   * with this span as `parent` share it.
   */
  readonly traceId: string;
  /**
   * W3C span id (16 lowercase hex characters) assigned when the span started.
   */
  readonly spanId: string;
  /**
   * Adds attributes to the span. Setting a key again replaces its value. Values go through the
   * same validation as `logEvent` attributes: empty keys and keys in the reserved `expo.*`
   * namespace are dropped with a warning.
   *
   * Has no effect after `end()`.
   *
   * @param attributes The attributes to add.
   *
   * @example
   * ```ts
   * span.setAttributes({ 'cart.items': 3, 'payment.method': 'card' });
   * ```
   */
  setAttributes(attributes: Record<string, LogAttributeValue>): void;
  /**
   * Adds a point-in-time event to the span, such as a checkpoint inside the measured operation.
   * An event is dropped with a warning when its name is empty, starts with the reserved `expo.`
   * prefix, or is longer than 256 characters. At most 32 events of a span reach the server.
   *
   * Has no effect after `end()`.
   *
   * @param name The event name, for example, `'cart-validated'`.
   * @param options Event attributes and an optional event time.
   *
   * @example
   * ```ts
   * span.addEvent('cart-validated', { attributes: { 'cart.items': 3 } });
   * ```
   */
  addEvent(name: string, options?: SpanEventOptions): void;
  /**
   * Ends the span and saves it, so it is sent with the next dispatch. Only the first call has an
   * effect. Later calls log a warning and do nothing.
   *
   * @param options An optional status, an error message for the `'error'` status, and an
   * optional end time.
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

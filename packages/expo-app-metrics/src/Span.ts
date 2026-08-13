import type { SharedObject } from 'expo';

import type { LogAttributeValue, SpanEndOptions, SpanEventOptions } from './types';

/**
 * A span in flight, backed by a native shared object returned by `startSpan`. Mutators
 * accumulate state in memory; nothing is persisted until `end()`, which writes the completed
 * span exactly once. A `Span` that is garbage-collected without `end()` is dropped.
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
   * Merges attributes into the span; keys set later win over earlier ones. Values go through
   * the same validation as `logEvent` attributes: empty keys and the reserved `expo.*`
   * namespace are dropped with a warning.
   *
   * Has no effect after `end()`.
   */
  setAttributes(attributes: Record<string, LogAttributeValue>): void;
  /**
   * Appends a point-in-time event to the span, like a checkpoint inside the measured
   * operation. Events without a name are dropped. At most 32 events reach the server;
   * anything past that is counted as dropped.
   *
   * Has no effect after `end()`.
   */
  addEvent(name: string, options?: SpanEventOptions): void;
  /**
   * Ends the span and persists it for export. Only the first call has an effect; later calls
   * are ignored with a warning.
   */
  end(options?: SpanEndOptions): void;
}

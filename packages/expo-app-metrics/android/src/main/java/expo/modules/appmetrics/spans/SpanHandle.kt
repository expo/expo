// Copyright 2025-present 650 Industries. All rights reserved.

package expo.modules.appmetrics.spans

import expo.modules.appmetrics.storage.Span
import expo.modules.kotlin.sharedobjects.SharedObject

/**
 * The native side of the JS `Span` object returned by `startSpan`. A thin shell around
 * `SpanRecorder`: JS mutators forward to the recorder, and `end` hands the completed row to
 * `onEnd` (the module wires this to the database insert). Mirrors the iOS `SpanHandle`.
 *
 * A handle garbage-collected without `end` simply drops its span — the recorder holds the
 * only state, so nothing lingers. That is deliberate: an unended span has no meaningful end
 * timestamp, and inventing one at GC time would record the collector's schedule, not the
 * operation's duration.
 */
class SpanHandle(
  val recorder: SpanRecorder,
  private val onEnd: (Span) -> Unit
) : SharedObject() {
  /**
   * Ends the underlying recorder; the second and later calls are ignored there, so `onEnd`
   * fires at most once.
   */
  fun end(statusCode: Int?, statusMessage: String?, endTimestampMs: Long) {
    val row = recorder.end(
      statusCode = statusCode,
      statusMessage = statusMessage,
      endTimestampMs = endTimestampMs
    ) ?: return
    onEnd(row)
  }
}

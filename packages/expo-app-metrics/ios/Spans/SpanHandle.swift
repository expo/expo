// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// The native side of the JS `Span` object returned by `startSpan`. A thin shell around
/// `SpanRecorder`: JS mutators forward to the recorder, and `end` hands the completed row to
/// `onEnd` (the module wires this to the database insert).
///
/// A handle garbage-collected without `end` simply drops its span — the recorder holds the
/// only state, so nothing lingers. That is deliberate: an unended span has no meaningful end
/// timestamp, and inventing one at GC time would record the collector's schedule, not the
/// operation's duration.
public final class SpanHandle: SharedObject {
  let recorder: SpanRecorder
  private let onEnd: @Sendable (SpanRow) -> Void

  init(recorder: SpanRecorder, onEnd: @escaping @Sendable (SpanRow) -> Void) {
    self.recorder = recorder
    self.onEnd = onEnd
    super.init()
  }

  /// Ends the underlying recorder; the second and later calls are ignored there, so `onEnd`
  /// fires at most once.
  func end(statusCode: Int?, statusMessage: String?, endTimestampMs: Int64) {
    guard
      let row = recorder.end(
        statusCode: statusCode,
        statusMessage: statusMessage,
        endTimestampMs: endTimestampMs
      )
    else {
      return
    }
    onEnd(row)
  }
}

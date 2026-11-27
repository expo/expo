// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// The JS `Span` object returned by `startSpan`. JS mutators forward to the recorder of its
/// `SpanHandle`. It is public only because the `@SharedObject` macro warns about an internal class.
@SharedObject("Span")
public final class SpanObject: SharedObject {
  let handle: SpanHandle

  init(_ handle: SpanHandle) {
    self.handle = handle
    super.init()
  }

  // MARK: - JavaScript members

  @JS
  var traceId: String {
    return handle.recorder.traceId
  }

  @JS
  var spanId: String {
    return handle.recorder.spanId
  }

  @JS
  func setAttributes(_ attributes: [String: Any]) {
    handle.recorder.setAttributes(attributes)
  }

  @JS
  func addEvent(_ name: String, _ options: SpanEventOptions?) {
    handle.recorder.addEvent(
      name: name,
      attributes: options?.attributes,
      timeMs: resolvedTimestamp(options?.time, field: "time")
    )
  }

  @JS
  func end(_ options: SpanEndOptions?) {
    handle.end(
      statusCode: spanStatusCode(from: options?.status),
      statusMessage: options?.message,
      endTimestampMs: resolvedTimestamp(options?.endTime, field: "endTime")
    )
  }
}

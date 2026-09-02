// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation

/// In-memory state of one in-flight span between `startSpan` and `end`. This is the testable
/// core behind the JS `Span` handle: it owns the attribute/event accumulation and the end-once
/// rule, and produces the write-once `SpanRow` when the span's life ends. Nothing touches the
/// database until then — the `spans` table stores only completed spans.
///
/// Ids are minted here, at start: a child started while this span is in flight references
/// `traceId`/`spanId` before any row exists, and the row written at `end` carries the same
/// identity. Timestamps are passed in by the caller (the module glue supplies "now" defaults),
/// keeping the recorder deterministic.
///
/// Thread-safety: JS calls arrive on the JS thread; a mutex guards the mutable tail so a handle
/// captured by concurrent callbacks can't corrupt state.
public final class SpanRecorder: Sendable {
  /// Upper bound on buffered events. The exporter truncates to the server's 32-event limit at
  /// dispatch and reports the overflow as dropped; buffering somewhat beyond that keeps the
  /// dropped count honest while bounding what a runaway caller can accumulate.
  static let maxEventCount = 128

  struct PendingEvent {
    let name: String
    let timeMs: Int64
    let attributes: [String: Any]?
  }

  private struct State {
    var attributes: [String: Any]
    var events: [PendingEvent] = []
    var ended = false
  }

  let traceId: String
  let spanId: String
  let parentSpanId: String?
  let name: String
  let sessionId: String
  let startTimestampMs: Int64

  private let state: Mutex<State>

  init(
    name: String,
    sessionId: String,
    parentTraceId: String? = nil,
    parentSpanId: String? = nil,
    attributes: [String: Any]? = nil,
    startTimestampMs: Int64
  ) {
    // A child continues its parent's trace; a root span starts a fresh one.
    self.traceId = parentTraceId ?? SpanRow.generateTraceId()
    self.spanId = SpanRow.generateSpanId()
    self.parentSpanId = parentSpanId
    self.name = name
    self.sessionId = sessionId
    self.startTimestampMs = startTimestampMs
    // Attributes go through the same validation as log-event attributes (empty keys, the
    // reserved `expo.*` namespace, and the per-record cap are dropped with a warning).
    self.state = Mutex(State(attributes: sanitizeLogEventAttributes(attributes).attributes ?? [:]))
  }

  /// Merges attributes into the span; keys set later win. Values are validated the same way as
  /// at construction. No-op after `end`.
  func setAttributes(_ attributes: [String: Any]) {
    guard let sanitized = sanitizeLogEventAttributes(attributes).attributes else {
      return
    }
    state.withLock { state in
      if state.ended {
        return
      }
      state.attributes.merge(sanitized) { _, new in new }
    }
  }

  /// Appends a point-in-time event. Events whose name trims to empty are dropped (the server
  /// drops them anyway), as is anything past `maxEventCount`. No-op after `end`.
  func addEvent(name: String, attributes: [String: Any]?, timeMs: Int64) {
    let trimmedName = name.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmedName.isEmpty else {
      logger.warn("[AppMetrics] Dropping a span event without a name")
      return
    }
    let sanitized = sanitizeLogEventAttributes(attributes).attributes
    state.withLock { state in
      if state.ended {
        return
      }
      guard state.events.count < Self.maxEventCount else {
        logger.warn("[AppMetrics] Dropping a span event past the \(Self.maxEventCount)-event limit")
        return
      }
      state.events.append(PendingEvent(name: trimmedName, timeMs: timeMs, attributes: sanitized))
    }
  }

  /// Ends the span exactly once and returns the completed row; every later call warns and
  /// returns `nil`. `statusMessage` is only stored alongside an explicit status code — a
  /// message with no status has no OTLP representation.
  func end(statusCode: Int?, statusMessage: String?, endTimestampMs: Int64) -> SpanRow? {
    let snapshot: State? = state.withLock { state in
      if state.ended {
        return nil
      }
      state.ended = true
      return state
    }
    guard let snapshot else {
      logger.warn("[AppMetrics] Span \"\(name)\" was already ended; ignoring this end() call")
      return nil
    }
    return SpanRow(
      sessionId: sessionId,
      traceId: traceId,
      spanId: spanId,
      parentSpanId: parentSpanId,
      name: name,
      kind: SpanRow.internalKind,
      startTimestampMs: startTimestampMs,
      endTimestampMs: endTimestampMs,
      statusCode: statusCode,
      statusMessage: statusCode != nil ? statusMessage : nil,
      attributes: snapshot.attributes.isEmpty ? nil : serializeJSON(snapshot.attributes),
      events: snapshot.events.isEmpty
        ? nil
        : serializeJSON(
          snapshot.events.map { event in
            var encoded: [String: Any] = [
              "name": event.name,
              "timeMs": event.timeMs,
            ]
            if let attributes = event.attributes, !attributes.isEmpty {
              encoded["attributes"] = attributes
            }
            return encoded
          }
        )
    )
  }

  /// Serializes a sanitized attribute/event payload; the values already passed validation, so
  /// a failure means a programming error and degrading to `nil` (dropped blob) is safe.
  private func serializeJSON(_ object: Any) -> String? {
    guard let data = try? JSONSerialization.data(withJSONObject: object) else {
      logger.warn("[AppMetrics] Failed to serialize span payload for \"\(name)\"")
      return nil
    }
    return String(data: data, encoding: .utf8)
  }
}

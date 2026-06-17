// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// An unhandled JavaScript error forwarded from the JS-side `global.ErrorUtils` handler. Recorded as
/// an `exception` log event following OpenTelemetry's exception conventions.
@Record
struct ErrorReport {
  var source: Source = .global
  var type: String?
  var message: String = ""
  var stacktrace: String?
  var isFatal: Bool = false

  /// How the error was captured. A closed set so the `expo.error.source` attribute stays consistent.
  enum Source: String, Enumerable {
    case global
  }

  /// Builds the `exception` log event for the live path. Following OpenTelemetry's exception-in-logs
  /// convention, the error rides as `exception.*` attributes (the event name is `exception` because
  /// this captures errors from a handler, not a specific operation). `expo.error.*` carries the bits
  /// OTel has no field for: the capture source and whether the error was fatal. Fatal errors log at
  /// `fatal` severity, the rest at `error`.
  func toLogRecord() -> LogRecord {
    // Absent `type`/`stacktrace` are kept as explicit `null` rather than omitted, so the `exception`
    // event always carries the same attribute keys. The boxed optionals encode as JSON `null`.
    let attributes: [String: Any] = [
      "expo.error.source": source.rawValue,
      "expo.error.is_fatal": isFatal,
      "exception.type": type as Any,
      "exception.message": message,
      "exception.stacktrace": stacktrace as Any,
    ]
    return LogRecord(
      name: "exception",
      attributes: attributes,
      severity: isFatal ? .fatal : .error
    )
  }

  /// Snapshots this report for durable on-disk storage, capturing the session it belongs to and the
  /// time it happened (both resolved now, since by drain time the main session has rotated).
  func toPendingError(sessionId: String) -> PendingErrorStore.PendingError {
    return PendingErrorStore.PendingError(
      source: source.rawValue,
      type: type,
      message: message,
      stacktrace: stacktrace,
      sessionId: sessionId,
      timestamp: Date.now.ISO8601Format()
    )
  }
}

extension PendingErrorStore.PendingError {
  /// Builds the `exception` log event for a fatal error ingested from disk on the next launch, using
  /// the session and timestamp captured at fatal time. See `ErrorReport.toLogRecord` for the shape.
  func toLogRecord() -> LogRecord {
    let attributes: [String: Any] = [
      "expo.error.source": source,
      "expo.error.is_fatal": true,
      "exception.type": type as Any,
      "exception.message": message,
      "exception.stacktrace": stacktrace as Any,
    ]
    return LogRecord(
      name: "exception",
      attributes: attributes,
      severity: .fatal,
      timestamp: timestamp
    )
  }
}

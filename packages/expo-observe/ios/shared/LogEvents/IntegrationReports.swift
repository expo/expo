// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation

/// Attribute key under which the SDK stores the name of the integration that recorded a log event or an error.
let integrationNameAttributeKey = "expo.integration.name"

extension AppMetrics {
  /// Records an error that an integration reports from native code, as a non-fatal `js.exception` event with the
  /// `integration` source. The event has the same shape as an error that a JavaScript integration reports. It also has
  /// the `expo.integration.name` attribute, and the `expo.error.code` attribute when `code` is set.
  ///
  /// When `persistImmediately` is `true`, the error is written to disk on the calling thread and recorded on the next
  /// launch, like a fatal JavaScript error. Use it for an error that is reported just before the process can end.
  static func reportIntegrationError(
    integration: String,
    type: String,
    message: String,
    stacktrace: String? = nil,
    code: String? = nil,
    persistImmediately: Bool = false
  ) {
    if persistImmediately {
      PendingErrorStore.write(
        PendingErrorStore.PendingError(
          source: ErrorReport.Source.integration.rawValue,
          type: type,
          message: message,
          stacktrace: stacktrace,
          sessionId: AppMetrics.mainSession.id,
          timestamp: Date.now.ISO8601Format(),
          isFatal: false,
          code: code,
          integration: integration
        )
      )
      return
    }
    let record = integrationErrorRecord(
      integration: integration,
      type: type,
      message: message,
      stacktrace: stacktrace,
      code: code
    )
    AppMetricsActor.isolated {
      AppMetrics.mainSession.receiveLog(record)
    }
  }

  /// Records a log event that an integration reports from native code. The name, display name, body and attributes
  /// follow the rules of `logEvent` in JavaScript. The event also has the `expo.integration.name` attribute.
  ///
  /// Returns `false` when the name is not valid. Then nothing is recorded.
  @discardableResult
  static func logIntegrationEvent(
    integration: String,
    name: String,
    displayName: String? = nil,
    body: String? = nil,
    attributes: [String: Any]? = nil,
    severity: Severity = .info
  ) -> Bool {
    guard
      let record = integrationEventRecord(
        integration: integration,
        name: name,
        displayName: displayName,
        body: body,
        attributes: attributes,
        severity: severity
      )
    else {
      return false
    }
    AppMetricsActor.isolated {
      AppMetrics.mainSession.receiveLog(record)
    }
    return true
  }

  static func integrationErrorRecord(
    integration: String,
    type: String,
    message: String,
    stacktrace: String?,
    code: String?
  ) -> LogRecord {
    return makeExceptionLogRecord(
      source: ErrorReport.Source.integration.rawValue,
      type: type,
      message: message,
      stacktrace: stacktrace,
      componentStack: nil,
      isFatal: false,
      code: code,
      integration: integration
    )
  }

  /// Returns `nil` when the name is not valid. `validateEventName` prints the reason.
  static func integrationEventRecord(
    integration: String,
    name: String,
    displayName: String?,
    body: String?,
    attributes: [String: Any]?,
    severity: Severity
  ) -> LogRecord? {
    guard let validatedName = validateEventName(name) else {
      return nil
    }
    let source = "logIntegrationEvent"
    let sanitized = sanitizeLogEventAttributes(attributes, source: source)
    var recordAttributes =
      withDisplayNameAttribute(sanitized.attributes, displayName: validateDisplayName(displayName)) ?? [:]
    // Added after `sanitizeLogEventAttributes`, which drops keys in the reserved `expo.` namespace.
    recordAttributes[integrationNameAttributeKey] = integration
    return LogRecord(
      name: validatedName,
      body: validateEventBody(body, source: source),
      attributes: recordAttributes,
      droppedAttributesCount: sanitized.droppedCount,
      severity: severity
    )
  }
}

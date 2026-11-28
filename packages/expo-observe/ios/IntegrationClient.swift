// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoObserveInterface
import Foundation

/// Records what integration clients report. Tests replace it.
internal protocol IntegrationRecorder: Sendable {
  /// Whether the user granted consent to Observe. Without consent, nothing is stored or sent.
  var isConsentGranted: Bool { get }
  func reportError(_ report: ObserveErrorReport, integration: String)
  /// Returns `false` when the event is not valid. Then nothing is recorded.
  func logEvent(
    _ name: String,
    displayName: String?,
    body: String?,
    attributes: [String: Any],
    severity: Severity,
    integration: String
  ) -> Bool
}

internal struct AppMetricsIntegrationRecorder: IntegrationRecorder {
  var isConsentGranted: Bool {
    return ObserveConsent.isGranted
  }

  func reportError(_ report: ObserveErrorReport, integration: String) {
    AppMetrics.reportIntegrationError(
      integration: integration,
      type: report.type,
      message: report.message,
      stacktrace: report.stacktrace,
      code: report.code,
      persistImmediately: report.persistImmediately
    )
  }

  func logEvent(
    _ name: String,
    displayName: String?,
    body: String?,
    attributes: [String: Any],
    severity: Severity,
    integration: String
  ) -> Bool {
    return AppMetrics.logIntegrationEvent(
      integration: integration,
      name: name,
      displayName: displayName,
      body: body,
      attributes: attributes,
      severity: severity
    )
  }
}

/// The client of one setup of an integration. All integrations report through this class, so they share the same
/// rules: consent, the `ignoredCodes` option, and no reports after teardown.
internal final class IntegrationClient: ObserveClient, @unchecked Sendable {
  /// The `message` attribute of a warning has at most this many characters, because attributes are sent with every
  /// dispatch.
  static let maxMessageAttributeLength = 500

  let integration: String
  private let ignoredCodes: Set<String>
  private let recorder: any IntegrationRecorder

  /// Held while a report is recorded, so no report is recorded after `invalidate` returns.
  private let lock = NSLock()
  private var isValid = true

  init(integration: String, config: [String: Any], recorder: any IntegrationRecorder) {
    self.integration = integration
    self.ignoredCodes = Set((config["ignoredCodes"] as? [Any])?.compactMap { $0 as? String } ?? [])
    self.recorder = recorder
  }

  /// Stops the client. Every function does nothing after this returns.
  func invalidate() {
    lock.withLock {
      isValid = false
    }
  }

  @discardableResult
  func reportError(_ report: ObserveErrorReport) -> Bool {
    return lock.withLock {
      guard isValid, recorder.isConsentGranted, !isIgnored(report.code) else {
        return false
      }
      recorder.reportError(report, integration: integration)
      return true
    }
  }

  @discardableResult
  func reportWarning(_ report: ObserveWarningReport) -> Bool {
    return lock.withLock {
      guard isValid, recorder.isConsentGranted, !isIgnored(report.code) else {
        return false
      }
      var attributes: [String: Any] = report.attributes.mapValues { $0.anyValue }
      // `eas observe:events` and `observe:session` show attributes but not the body, so the message is copied here
      // to stay queryable.
      attributes["message"] = String(report.message.prefix(Self.maxMessageAttributeLength))
      if let code = report.code {
        attributes["code"] = code
      }
      return recorder.logEvent(
        report.name,
        displayName: report.displayName,
        body: report.message,
        attributes: attributes,
        severity: .warn,
        integration: integration
      )
    }
  }

  @discardableResult
  func logEvent(_ event: ObserveEvent) -> Bool {
    return lock.withLock {
      guard isValid, recorder.isConsentGranted else {
        return false
      }
      return recorder.logEvent(
        event.name,
        displayName: event.displayName,
        body: event.body,
        attributes: event.attributes.mapValues { $0.anyValue },
        severity: Severity(rawValue: event.severity.rawValue) ?? .info,
        integration: integration
      )
    }
  }

  private func isIgnored(_ code: String?) -> Bool {
    guard let code else {
      return false
    }
    return ignoredCodes.contains(code)
  }
}

extension ObserveAttributeValue {
  fileprivate var anyValue: Any {
    switch self {
    case .string(let value):
      return value
    case .number(let value):
      return value
    case .bool(let value):
      return value
    }
  }
}

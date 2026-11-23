// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoObserveInterface
import Foundation

@testable import ExpoObserve

/// Keeps what the clients report instead of recording it.
final class FakeIntegrationRecorder: IntegrationRecorder, @unchecked Sendable {
  struct Error {
    let report: ObserveErrorReport
    let integration: String
  }

  struct Event {
    let name: String
    let displayName: String?
    let body: String?
    let attributes: [String: Any]
    let severity: Severity
    let integration: String
  }

  private let lock = NSLock()
  private var recordedErrors: [Error] = []
  private var recordedEvents: [Event] = []
  private var consent = true

  var isConsentGranted: Bool {
    get { lock.withLock { consent } }
    set { lock.withLock { consent = newValue } }
  }

  var errors: [Error] {
    return lock.withLock { recordedErrors }
  }

  var events: [Event] {
    return lock.withLock { recordedEvents }
  }

  func reportError(_ report: ObserveErrorReport, integration: String) {
    lock.withLock {
      recordedErrors.append(Error(report: report, integration: integration))
    }
  }

  func logEvent(
    _ name: String,
    displayName: String?,
    body: String?,
    attributes: [String: Any],
    severity: Severity,
    integration: String
  ) -> Bool {
    lock.withLock {
      recordedEvents.append(
        Event(
          name: name,
          displayName: displayName,
          body: body,
          attributes: attributes,
          severity: severity,
          integration: integration
        )
      )
    }
    return true
  }
}

/// Records its setups and teardowns as `setup <config JSON>` and `teardown`.
final class FakeIntegration: ObserveIntegration, @unchecked Sendable {
  struct SetupError: Swift.Error {}

  let name: String
  private let lock = NSLock()
  private var recordedCalls: [String] = []
  private var receivedClients: [any ObserveClient] = []
  private let throwsOnSetup: Bool

  init(name: String = "fake", throwsOnSetup: Bool = false) {
    self.name = name
    self.throwsOnSetup = throwsOnSetup
  }

  var calls: [String] {
    return lock.withLock { recordedCalls }
  }

  var clients: [any ObserveClient] {
    return lock.withLock { receivedClients }
  }

  func setup(config: [String: Any], observe: any ObserveClient) throws -> (() -> Void)? {
    let data = try JSONSerialization.data(withJSONObject: config, options: [.sortedKeys])
    lock.withLock {
      recordedCalls.append("setup \(String(decoding: data, as: UTF8.self))")
      receivedClients.append(observe)
    }
    if throwsOnSetup {
      throw SetupError()
    }
    return { [self] in
      lock.withLock {
        recordedCalls.append("teardown")
      }
    }
  }
}

func makeErrorReport(_ message: String, code: String? = nil) -> ObserveErrorReport {
  return ObserveErrorReport(type: "fake.error", message: message, code: code)
}

func makeWarningReport(_ message: String, code: String? = nil) -> ObserveWarningReport {
  return ObserveWarningReport(name: "fake.warning", message: message, code: code)
}

/// Keeps the reports of an integration instead of recording them.
final class FakeObserveClient: ObserveClient, @unchecked Sendable {
  private let lock = NSLock()
  private var reportedErrors: [ObserveErrorReport] = []
  private var reportedWarnings: [ObserveWarningReport] = []

  var errors: [ObserveErrorReport] {
    return lock.withLock { reportedErrors }
  }

  var warnings: [ObserveWarningReport] {
    return lock.withLock { reportedWarnings }
  }

  func reportError(_ report: ObserveErrorReport) -> Bool {
    lock.withLock {
      reportedErrors.append(report)
    }
    return true
  }

  func reportWarning(_ report: ObserveWarningReport) -> Bool {
    lock.withLock {
      reportedWarnings.append(report)
    }
    return true
  }

  func logEvent(_ event: ObserveEvent) -> Bool {
    return true
  }
}

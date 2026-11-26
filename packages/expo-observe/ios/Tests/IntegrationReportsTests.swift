// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation
import Testing

@testable import ExpoObserve

@Suite("IntegrationReports")
struct IntegrationReportsTests {
  @Test
  func `an integration error is a non-fatal exception with the integration name and code`() throws {
    let record = AppMetrics.integrationErrorRecord(
      integration: "expo-updates",
      type: "updates.error",
      message: "UpdateFailedToLoad: boom",
      stacktrace: nil,
      code: "UpdateFailedToLoad"
    )

    #expect(record.name == "js.exception")
    #expect(record.severity == .error)
    let attributes = try #require(record.attributes?.value as? [String: Any])
    #expect(attributes["expo.error.source"] as? String == "integration")
    #expect(attributes["expo.error.is_fatal"] as? Bool == false)
    #expect(attributes["expo.integration.name"] as? String == "expo-updates")
    #expect(attributes["expo.error.code"] as? String == "UpdateFailedToLoad")
    #expect(attributes["exception.type"] as? String == "updates.error")
    #expect(attributes["exception.message"] as? String == "UpdateFailedToLoad: boom")
  }

  @Test
  func `an integration error without a code has no code attribute`() throws {
    let record = AppMetrics.integrationErrorRecord(
      integration: "my-library",
      type: "my-library.error",
      message: "boom",
      stacktrace: "at f (app.js:1:1)",
      code: nil
    )

    let attributes = try #require(record.attributes?.value as? [String: Any])
    #expect(attributes.keys.contains("expo.error.code") == false)
    #expect(attributes["exception.stacktrace"] as? String == "at f (app.js:1:1)")
  }

  @Test
  func `a pending integration error keeps its code, integration name and severity`() throws {
    let record = PendingErrorStore.PendingError(
      source: "integration",
      type: "updates.error_recovery",
      message: "boom",
      stacktrace: nil,
      sessionId: "s",
      timestamp: "2026-01-01T00:00:00Z",
      isFatal: false,
      code: "JSRuntimeError",
      integration: "expo-updates"
    ).toLogRecord()

    #expect(record.severity == .error)
    #expect(record.timestamp == "2026-01-01T00:00:00Z")
    let attributes = try #require(record.attributes?.value as? [String: Any])
    #expect(attributes["expo.error.is_fatal"] as? Bool == false)
    #expect(attributes["expo.error.code"] as? String == "JSRuntimeError")
    #expect(attributes["expo.integration.name"] as? String == "expo-updates")
  }

  @Test
  func `a pending error file from an earlier version is a fatal error`() throws {
    let json = """
      {"source":"global","type":"Error","message":"boom","sessionId":"s","timestamp":"2026-01-01T00:00:00Z"}
      """
    let pendingError = try JSONDecoder().decode(PendingErrorStore.PendingError.self, from: Data(json.utf8))
    let record = pendingError.toLogRecord()

    #expect(record.severity == .fatal)
    let attributes = try #require(record.attributes?.value as? [String: Any])
    #expect(attributes["expo.error.is_fatal"] as? Bool == true)
    #expect(attributes.keys.contains("expo.error.code") == false)
    #expect(attributes.keys.contains("expo.integration.name") == false)
  }

  @Test
  func `an integration event has the integration name and drops reserved caller attributes`() throws {
    let record = try #require(
      AppMetrics.integrationEventRecord(
        integration: "expo-updates",
        name: "updates.warning",
        displayName: "Updates warning",
        body: "slow",
        attributes: ["code": "None", "expo.integration.name": "spoofed"],
        severity: .warn
      )
    )

    #expect(record.name == "updates.warning")
    #expect(record.body == "slow")
    #expect(record.severity == .warn)
    #expect(record.droppedAttributesCount == 1)
    let attributes = try #require(record.attributes?.value as? [String: Any])
    #expect(attributes["code"] as? String == "None")
    #expect(attributes["expo.integration.name"] as? String == "expo-updates")
    #expect(attributes["expo.log.display_name"] as? String == "Updates warning")
  }

  @Test
  func `an integration event with a reserved name is not recorded`() {
    #expect(AppMetrics.logIntegrationEvent(integration: "my-library", name: "expo.secret") == false)
  }
}

// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoObserveInterface
import Testing

@testable import ExpoObserve

@Suite("IntegrationClient")
struct IntegrationClientTests {
  private let recorder = FakeIntegrationRecorder()

  private func makeClient(config: [String: Any] = [:]) -> IntegrationClient {
    return IntegrationClient(integration: "fake", config: config, recorder: recorder)
  }

  @Test
  func `records an error with the integration name`() {
    let client = makeClient()
    let report = ObserveErrorReport(
      type: "fake.error",
      message: "boom",
      stacktrace: "at f",
      code: "Code",
      persistImmediately: true
    )

    #expect(client.reportError(report))
    #expect(recorder.errors.count == 1)
    let recorded = recorder.errors[0]
    #expect(recorded.integration == "fake")
    #expect(recorded.report.type == "fake.error")
    #expect(recorded.report.message == "boom")
    #expect(recorded.report.stacktrace == "at f")
    #expect(recorded.report.code == "Code")
    #expect(recorded.report.persistImmediately)
  }

  @Test
  func `records a warning as a warn event with the message and the code as attributes`() throws {
    let client = makeClient()
    let report = ObserveWarningReport(
      name: "fake.warning",
      displayName: "Fake warning",
      message: "slow",
      code: "Code",
      attributes: ["updateId": .string("id"), "count": .number(2), "isEmbedded": .bool(true)]
    )

    #expect(client.reportWarning(report))
    let event = try #require(recorder.events.first)
    #expect(event.name == "fake.warning")
    #expect(event.displayName == "Fake warning")
    #expect(event.body == "slow")
    #expect(event.severity == .warn)
    #expect(event.integration == "fake")
    #expect(event.attributes["message"] as? String == "slow")
    #expect(event.attributes["code"] as? String == "Code")
    #expect(event.attributes["updateId"] as? String == "id")
    #expect(event.attributes["count"] as? Double == 2)
    #expect(event.attributes["isEmbedded"] as? Bool == true)
  }

  @Test
  func `caps the message attribute of a warning but not its body`() throws {
    let client = makeClient()
    let message = String(repeating: "a", count: IntegrationClient.maxMessageAttributeLength + 1)

    #expect(client.reportWarning(makeWarningReport(message)))
    let event = try #require(recorder.events.first)
    #expect((event.attributes["message"] as? String)?.count == IntegrationClient.maxMessageAttributeLength)
    #expect(event.body == message)
  }

  @Test
  func `drops errors and warnings whose code the config ignores`() {
    let client = makeClient(config: ["ignoredCodes": ["Ignored", 1] as [Any]])

    #expect(!client.reportError(makeErrorReport("boom", code: "Ignored")))
    #expect(!client.reportWarning(makeWarningReport("slow", code: "Ignored")))
    #expect(client.reportError(makeErrorReport("boom", code: "Other")))
    #expect(client.reportError(makeErrorReport("no code")))
    #expect(recorder.errors.map(\.report.message) == ["boom", "no code"])
    #expect(recorder.events.isEmpty)
  }

  @Test
  func `reports nothing without consent`() {
    let client = makeClient()
    recorder.isConsentGranted = false

    #expect(!client.reportError(makeErrorReport("boom")))
    #expect(!client.reportWarning(makeWarningReport("slow")))
    #expect(!client.logEvent(ObserveEvent(name: "fake.event")))
    #expect(recorder.errors.isEmpty)
    #expect(recorder.events.isEmpty)

    recorder.isConsentGranted = true
    #expect(client.reportError(makeErrorReport("boom")))
    #expect(client.reportWarning(makeWarningReport("slow")))
    #expect(client.logEvent(ObserveEvent(name: "fake.event")))
  }

  @Test
  func `does nothing after invalidate`() {
    let client = makeClient()
    client.invalidate()

    #expect(!client.reportError(makeErrorReport("boom")))
    #expect(!client.reportWarning(makeWarningReport("slow")))
    #expect(!client.logEvent(ObserveEvent(name: "fake.event")))
    #expect(recorder.errors.isEmpty)
    #expect(recorder.events.isEmpty)
  }

  @Test
  func `records an event with its severity`() throws {
    let client = makeClient()
    let event = ObserveEvent(
      name: "fake.event",
      displayName: "Fake event",
      body: "body",
      attributes: ["count": .number(1)],
      severity: .debug
    )

    #expect(client.logEvent(event))
    let recorded = try #require(recorder.events.first)
    #expect(recorded.name == "fake.event")
    #expect(recorded.displayName == "Fake event")
    #expect(recorded.body == "body")
    #expect(recorded.severity == .debug)
    #expect(recorded.integration == "fake")
    #expect(recorded.attributes["count"] as? Double == 1)
  }
}

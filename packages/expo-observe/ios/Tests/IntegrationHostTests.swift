// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoObserveInterface
import Foundation
import Testing

@testable import ExpoObserve

@Suite("IntegrationHost")
struct IntegrationHostTests {
  private let recorder = FakeIntegrationRecorder()
  private let host: IntegrationHost
  private let integration = FakeIntegration()

  init() {
    host = IntegrationHost(recorder: recorder)
  }

  // MARK: - Lifecycle

  @Test
  func `sets up an integration that the config enables`() {
    host.register(integration)
    host.apply(["fake": #"{"level":1}"#])

    #expect(integration.calls == [#"setup {"level":1}"#])
  }

  @Test
  func `does not set up an integration before a config is applied`() {
    host.register(integration)

    #expect(integration.calls.isEmpty)
  }

  @Test
  func `sets up an integration that registers after the config`() {
    host.apply(["fake": "{}"])
    host.register(integration)

    #expect(integration.calls == ["setup {}"])
  }

  @Test
  func `does not set up an integration that the config does not enable`() {
    host.register(integration)
    host.apply(["other": "{}"])

    #expect(integration.calls.isEmpty)
  }

  @Test
  func `keeps an integration running when its config does not change`() {
    host.register(integration)
    host.apply(["fake": "{}"])
    host.apply(["fake": "{}", "other": "{}"])

    #expect(integration.calls == ["setup {}"])
  }

  @Test
  func `tears down and sets up again with a new client when the config changes`() {
    host.register(integration)
    host.apply(["fake": #"{"level":1}"#])
    host.apply(["fake": #"{"level":2}"#])

    #expect(integration.calls == [#"setup {"level":1}"#, "teardown", #"setup {"level":2}"#])
    let clients = integration.clients
    #expect(clients.count == 2)
    #expect(clients[0] !== clients[1])
    #expect(!clients[0].reportError(makeErrorReport("from the old client")))
    #expect(clients[1].reportError(makeErrorReport("from the new client")))
  }

  @Test
  func `tears down an integration that the config turns off and stops its client`() throws {
    host.register(integration)
    host.apply(["fake": "{}"])
    let client = try #require(integration.clients.first)
    #expect(client.reportError(makeErrorReport("while set up")))

    host.apply([:])

    #expect(integration.calls == ["setup {}", "teardown"])
    #expect(!client.reportError(makeErrorReport("after teardown")))
    #expect(recorder.errors.map(\.report.message) == ["while set up"])
    #expect(recorder.errors.map(\.integration) == ["fake"])
  }

  @Test
  func `passes the config options to the client`() {
    host.register(integration)
    host.apply(["fake": #"{"ignoredCodes":["Ignored"]}"#])

    #expect(!integration.clients[0].reportError(makeErrorReport("boom", code: "Ignored")))
  }

  @Test
  func `retries a setup that throws only when the config changes`() {
    let failing = FakeIntegration(name: "failing", throwsOnSetup: true)
    host.register(failing)
    host.register(integration)
    host.apply(["failing": "{}", "fake": "{}"])
    host.apply(["failing": "{}", "fake": "{}"])

    #expect(failing.calls == ["setup {}"])
    #expect(integration.calls == ["setup {}"])
    #expect(!failing.clients[0].reportError(makeErrorReport("boom")))

    host.apply(["failing": #"{"level":1}"#, "fake": "{}"])

    #expect(failing.calls == ["setup {}", #"setup {"level":1}"#])
  }

  @Test
  func `ignores a second integration with the same name`() {
    let duplicate = FakeIntegration()
    host.register(integration)
    host.register(duplicate)
    host.apply(["fake": "{}"])

    #expect(integration.calls == ["setup {}"])
    #expect(duplicate.calls.isEmpty)
  }

  @Test
  func `knows which native integrations are registered`() {
    host.register(integration)

    #expect(host.isRegistered("fake"))
    #expect(!host.isRegistered("other"))
  }

  // MARK: - Consent

  @Test
  func `does not set up an integration without consent`() {
    recorder.isConsentGranted = false
    host.register(integration)
    host.apply(["fake": "{}"])

    #expect(integration.calls.isEmpty)
  }

  @Test
  func `sets up after a grant and tears down after a revoke`() {
    recorder.isConsentGranted = false
    host.register(integration)
    host.apply(["fake": "{}"])

    recorder.isConsentGranted = true
    host.consentDidChange()
    #expect(integration.calls == ["setup {}"])

    recorder.isConsentGranted = false
    host.consentDidChange()
    #expect(integration.calls == ["setup {}", "teardown"])
  }

  // MARK: - Config conversion

  @Test
  func `true enables an integration with an empty config`() {
    #expect(IntegrationHost.configs(from: ["a": true, "b": false, "c": NSNull(), "d": "yes"]) == ["a": "{}"])
  }

  @Test
  func `an object enables an integration with the object as JSON with sorted keys`() {
    let configs = IntegrationHost.configs(from: ["a": ["z": 1, "b": ["x", true] as [Any]] as [String: Any]])

    #expect(configs == ["a": #"{"b":["x",true],"z":1}"#])
  }

  @Test
  func `leaves out the values that JSON cannot represent`() {
    let function: @Sendable () -> Void = {}
    let configs = IntegrationHost.configs(from: [
      "a": [
        "function": function,
        "nan": Double.nan,
        "nested": ["function": function, "kept": 1] as [String: Any],
        "kept": "value",
      ] as [String: Any]
    ])

    #expect(configs == ["a": #"{"kept":"value","nested":{"kept":1}}"#])
  }

  @Test
  func `no integrations object turns every integration off`() {
    #expect(IntegrationHost.configs(from: nil).isEmpty)
  }
}

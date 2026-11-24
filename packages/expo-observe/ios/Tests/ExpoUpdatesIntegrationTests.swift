// Copyright 2026-present 650 Industries. All rights reserved.

import EXUpdatesInterface
import Testing

@testable import ExpoObserve

/// An entry in the shape that expo-updates passes to `UpdatesLogEntryListenerRegistry`.
private func makeEntry(
  level: String,
  message: String = "boom",
  code: String = "UpdateFailedToLoad",
  key: String? = "launch.failed",
  updateId: String? = nil,
  assetId: String? = nil
) -> [String: Any] {
  var entry: [String: Any] = ["timestamp": UInt(1_700_000_000_000), "message": message, "code": code, "level": level]
  entry["key"] = key
  entry["updateId"] = updateId
  entry["assetId"] = assetId
  return entry
}

@Suite("ExpoUpdatesIntegration", .serialized)
struct ExpoUpdatesIntegrationTests {
  private let observe = FakeObserveClient()

  private func makeListener(config: [String: Any] = [:]) -> ExpoUpdatesLogListener {
    return ExpoUpdatesLogListener(config: config, observe: observe)
  }

  @Test
  func `reports an error entry as updates.error with the code at the start of the message`() throws {
    makeListener().updatesLogEntryWasLogged(makeEntry(level: "error", message: "Failed to launch update: boom"))

    let report = try #require(observe.errors.first)
    #expect(observe.errors.count == 1)
    #expect(report.type == "updates.error")
    #expect(report.message == "UpdateFailedToLoad: Failed to launch update: boom")
    #expect(report.code == "UpdateFailedToLoad")
    #expect(!report.persistImmediately)
  }

  @Test
  func `reports a fatal entry as an error`() {
    makeListener().updatesLogEntryWasLogged(makeEntry(level: "fatal"))

    #expect(observe.errors.map(\.type) == ["updates.error"])
  }

  @Test
  func `reports the JS error that error recovery handles as updates.error_recovery, written to disk at once`() throws {
    makeListener().updatesLogEntryWasLogged(
      makeEntry(
        level: "error",
        message: "ErrorRecovery: a JS exception was encountered: boom",
        code: "JSRuntimeError",
        key: "errorRecovery.jsException"
      )
    )

    let report = try #require(observe.errors.first)
    #expect(report.type == "updates.error_recovery")
    #expect(report.message == "ErrorRecovery: a JS exception was encountered: boom")
    #expect(report.code == "JSRuntimeError")
    #expect(report.persistImmediately)
  }

  @Test
  func `does not report the entry that error recovery logs before it crashes the app`() {
    makeListener().updatesLogEntryWasLogged(makeEntry(level: "error", key: "errorRecovery.crash"))

    #expect(observe.errors.isEmpty)
  }

  @Test
  func `reports warnings only when reportWarnings is set`() throws {
    let entry = makeEntry(
      level: "warn",
      message: "slow",
      code: "None",
      key: "remote.assetDownloadFailed",
      updateId: "update-id",
      assetId: "asset-id"
    )
    makeListener().updatesLogEntryWasLogged(entry)
    #expect(observe.warnings.isEmpty)

    makeListener(config: ["reportWarnings": true]).updatesLogEntryWasLogged(entry)

    let report = try #require(observe.warnings.first)
    #expect(report.name == "updates.warning")
    #expect(report.displayName == "Updates warning")
    #expect(report.message == "slow")
    #expect(report.code == "None")
    #expect(
      report.attributes == [
        "key": .string("remote.assetDownloadFailed"),
        "updateId": .string("update-id"),
        "assetId": .string("asset-id"),
      ]
    )
    #expect(observe.errors.isEmpty)
  }

  @Test
  func `does not report the entries whose key the config ignores`() {
    let listener = makeListener(config: ["ignoredKeys": ["launch.failed"], "reportWarnings": true])
    listener.updatesLogEntryWasLogged(makeEntry(level: "error", key: "launch.failed"))
    listener.updatesLogEntryWasLogged(makeEntry(level: "warn", key: "launch.failed"))
    listener.updatesLogEntryWasLogged(makeEntry(level: "error", key: "remote.fetchFailed"))

    #expect(observe.errors.map(\.message) == ["UpdateFailedToLoad: boom"])
    #expect(observe.warnings.isEmpty)
  }

  @Test
  func `ignores an entry without a message, a code or a level`() {
    let listener = makeListener()
    var entry = makeEntry(level: "error")
    entry["code"] = nil
    listener.updatesLogEntryWasLogged(entry)

    #expect(observe.errors.isEmpty)
  }

  @Test
  func `listens to expo-updates only while the integration is set up`() {
    let recorder = FakeIntegrationRecorder()
    let host = IntegrationHost(recorder: recorder)
    host.register(ExpoUpdatesIntegration())
    host.apply(["expo-updates": #"{"ignoredCodes":["UpdateServerUnreachable"]}"#])

    UpdatesLogEntryListenerRegistry.sharedInstance.notify(makeEntry(level: "error", message: "while set up"))
    UpdatesLogEntryListenerRegistry.sharedInstance.notify(
      makeEntry(level: "error", message: "offline", code: "UpdateServerUnreachable")
    )
    host.apply([:])
    UpdatesLogEntryListenerRegistry.sharedInstance.notify(makeEntry(level: "error", message: "after teardown"))

    #expect(recorder.errors.map(\.report.message) == ["UpdateFailedToLoad: while set up"])
    #expect(recorder.errors.map(\.integration) == ["expo-updates"])
  }
}

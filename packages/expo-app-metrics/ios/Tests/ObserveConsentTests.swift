import Foundation
import Testing
import os

@testable import ExpoAppMetrics

@Suite("ObserveConsent")
struct ObserveConsentTests {
  @Test
  func `absent ExpoObserve dictionary grants consent`() {
    #expect(ObserveConsent.isGranted(settings: nil))
  }

  @Test
  func `ExpoObserve dictionary without consent grants consent`() {
    #expect(ObserveConsent.isGranted(settings: [String: Any]()))
    #expect(ObserveConsent.isGranted(settings: ["other": "value"]))
  }

  @Test
  func `consent granted grants consent`() {
    #expect(ObserveConsent.isGranted(settings: ["consent": "granted"]))
  }

  @Test
  func `consent not-granted denies consent`() {
    #expect(!ObserveConsent.isGranted(settings: ["consent": "not-granted"]))
  }

  @Test
  func `unknown consent value denies consent`() {
    #expect(!ObserveConsent.isGranted(settings: ["consent": "pending"]))
    #expect(!ObserveConsent.isGranted(settings: ["consent": false]))
  }

  @Test
  func `ExpoObserve value that is not a dictionary denies consent`() {
    #expect(!ObserveConsent.isGranted(settings: "granted"))
    #expect(!ObserveConsent.isGranted(settings: ["granted"]))
  }
}

@Suite("ConsentGatedDefaults", .serialized)
struct ConsentGatedDefaultsTests {
  private let suiteName = "dev.expo.app-metrics.tests.consent-gated"

  init() {
    UserDefaults.standard.removePersistentDomain(forName: suiteName)
  }

  private struct Value: Codable, Equatable {
    var name: String
  }

  @Test
  func `saves nothing while consent is not granted and keeps the values in memory`() throws {
    let defaults = ConsentGatedDefaults(try #require(UserDefaults(suiteName: suiteName)), isGranted: { false })

    defaults.set("staging", forKey: "string")
    defaults.set(Int64(5), forKey: "integer")
    defaults.set(codable: Value(name: "value"), forKey: "codable")
    defaults.set("removed", forKey: "removed")
    defaults.set(nil, forKey: "removed")

    #expect(defaults.object(forKey: "string") as? String == "staging")
    #expect(defaults.object(forKey: "integer") as? Int64 == 5)
    #expect(defaults.codable(forKey: "codable", as: Value.self) == Value(name: "value"))
    #expect(defaults.object(forKey: "removed") == nil)
    #expect(UserDefaults.standard.persistentDomain(forName: suiteName)?.isEmpty ?? true)
  }

  @Test
  func `saves to the suite while consent is granted`() throws {
    let defaults = ConsentGatedDefaults(try #require(UserDefaults(suiteName: suiteName)), isGranted: { true })

    defaults.set("production", forKey: "string")

    #expect(defaults.object(forKey: "string") as? String == "production")
    #expect(UserDefaults.standard.persistentDomain(forName: suiteName)?["string"] as? String == "production")
  }

  @Test
  func `the first grant saves the values kept in memory`() throws {
    let granted = OSAllocatedUnfairLock(initialState: false)
    let defaults = ConsentGatedDefaults(
      try #require(UserDefaults(suiteName: suiteName)),
      isGranted: { granted.withLock { $0 } }
    )
    defaults.set("staging", forKey: "string")

    ConsentGatedDefaults.saveUnsavedValues()
    granted.withLock { $0 = true }

    #expect(UserDefaults.standard.persistentDomain(forName: suiteName)?["string"] as? String == "staging")
    granted.withLock { $0 = false }
    #expect(defaults.object(forKey: "string") == nil)
  }

  // Pauses the setter after its first gate read and runs `transition` on another thread in that
  // gap. Resumes the setter once the transition finished, or after 0.2 s when it waits for the lock.
  private func runInSetterGap(
    granted: OSAllocatedUnfairLock<Bool>,
    set: @escaping @Sendable (ConsentGatedDefaults) -> Void,
    transition: @escaping @Sendable () -> Void
  ) throws {
    let pauseNextRead = OSAllocatedUnfairLock(initialState: true)
    let checked = DispatchSemaphore(value: 0)
    let resume = DispatchSemaphore(value: 0)
    let setterDone = DispatchSemaphore(value: 0)
    let transitionDone = DispatchSemaphore(value: 0)
    let defaults = ConsentGatedDefaults(try #require(UserDefaults(suiteName: suiteName))) {
      let isGranted = granted.withLock { $0 }
      if pauseNextRead.withLock({ pause in
        defer { pause = false }
        return pause
      }) {
        checked.signal()
        _ = resume.wait(timeout: .now() + 5)
      }
      return isGranted
    }
    DispatchQueue.global().async {
      set(defaults)
      setterDone.signal()
    }
    #expect(checked.wait(timeout: .now() + 5) == .success)
    DispatchQueue.global().async {
      transition()
      transitionDone.signal()
    }
    let transitionFinished = transitionDone.wait(timeout: .now() + 0.2) == .success
    resume.signal()
    #expect(setterDone.wait(timeout: .now() + 5) == .success)
    if !transitionFinished {
      #expect(transitionDone.wait(timeout: .now() + 5) == .success)
    }
  }

  @Test
  func `a setter that reads the gate before the first grant still saves its value`() throws {
    let granted = OSAllocatedUnfairLock(initialState: false)

    try runInSetterGap(
      granted: granted,
      set: { $0.set("set-during-grant", forKey: "racing") },
      transition: {
        ConsentGatedDefaults.transitionLock.withLock {
          ConsentGatedDefaults.saveUnsavedValues()
          granted.withLock { $0 = true }
        }
      }
    )

    #expect(UserDefaults.standard.persistentDomain(forName: suiteName)?["racing"] as? String == "set-during-grant")
  }

  @Test
  func `a setter that reads the gate before a revoke saves nothing`() throws {
    let granted = OSAllocatedUnfairLock(initialState: true)
    let suiteName = suiteName

    // The steps of a revoke: close the gate under the lock, then delete the settings.
    try runInSetterGap(
      granted: granted,
      set: { $0.set("set-during-revoke", forKey: "racing") },
      transition: {
        ConsentGatedDefaults.transitionLock.withLock {
          granted.withLock { $0 = false }
        }
        UserDefaults.standard.removePersistentDomain(forName: suiteName)
      }
    )

    #expect(UserDefaults.standard.persistentDomain(forName: suiteName)?["racing"] == nil)
  }
}

@Suite("ObserveConsent value in UserDefaults", .serialized)
struct ObserveConsentUserDefaultsTests {
  private let suiteName = "dev.expo.app-metrics.tests.observe-consent"

  init() {
    UserDefaults.standard.removePersistentDomain(forName: suiteName)
  }

  @Test
  func `no saved value falls back to the app config`() throws {
    let defaults = try #require(UserDefaults(suiteName: suiteName))

    #expect(ObserveConsent.resolveState(from: defaults, settings: ["consent": "not-granted"]) == .notGranted)
    #expect(ObserveConsent.resolveState(from: defaults, settings: nil) == .granted)
  }

  @Test
  func `the saved value overrides the app config`() throws {
    let defaults = try #require(UserDefaults(suiteName: suiteName))

    ObserveConsent.save(granted: false, to: defaults)
    #expect(ObserveConsent.resolveState(from: defaults, settings: ["consent": "granted"]) == .notGranted)

    ObserveConsent.save(granted: true, to: defaults)
    #expect(ObserveConsent.resolveState(from: defaults, settings: ["consent": "not-granted"]) == .granted)
  }

  @Test
  func `a saved revoke survives the deletion of the settings`() {
    let defaults = UserDefaults.standard
    let previous = defaults.object(forKey: ObserveConsent.savedValueKey)
    defer { defaults.set(previous, forKey: ObserveConsent.savedValueKey) }

    // Other tests use the process gate while this test changes the saved choice.
    _ = ObserveConsent.state
    ObserveConsent.save(granted: false, to: defaults)

    AppMetricsUserDefaults.deleteStoredSettings()

    #expect(defaults.string(forKey: ObserveConsent.savedValueKey) == "not-granted")
  }
}

@Suite("ObserveConsent updates")
struct ObserveConsentUpdateTests {
  private let suiteName = "dev.expo.app-metrics.tests.consent-update.\(UUID().uuidString)"

  @Test
  func `the first grant saves the choice and buffered settings only once`() throws {
    let defaults = try #require(UserDefaults(suiteName: suiteName))
    defer { defaults.removePersistentDomain(forName: suiteName) }
    let saves = OSAllocatedUnfairLock(initialState: 0)
    let consent = ObserveConsent.Store(defaults: defaults, settings: ["consent": "not-granted"]) {
      saves.withLock { $0 += 1 }
    }

    #expect(consent.update(granted: true))
    #expect(consent.state == .granted)
    #expect(defaults.string(forKey: ObserveConsent.savedValueKey) == "granted")
    #expect(!consent.update(granted: true))
    #expect(saves.withLock { $0 } == 1)
  }

  @Test
  func `a revoke closes the gate and a later grant only saves the choice`() throws {
    let defaults = try #require(UserDefaults(suiteName: suiteName))
    defer { defaults.removePersistentDomain(forName: suiteName) }
    let consent = ObserveConsent.Store(defaults: defaults, settings: nil) {
      Issue.record("A deferred grant must keep the buffered settings in memory.")
    }

    #expect(consent.update(granted: false))
    #expect(consent.state == .notGranted)
    #expect(defaults.string(forKey: ObserveConsent.savedValueKey) == "not-granted")
    #expect(!consent.update(granted: false))
    #expect(!consent.update(granted: true))
    #expect(consent.state == .notGranted)
    #expect(defaults.string(forKey: ObserveConsent.savedValueKey) == "granted")
  }
}

@Suite("AppMetrics.deleteStoredData", .serialized)
struct DeleteStoredDataTests {
  @Test
  func `deletes the database, the pending-error files, and the settings`() throws {
    try withTemporaryDirectory { directory in
      let databaseDirectory = directory.appendingPathComponent("ExpoAppMetrics")
      let pendingErrorsDirectory = directory.appendingPathComponent("pending-errors")
      try FileManager.default.createDirectory(at: databaseDirectory, withIntermediateDirectories: true)
      try FileManager.default.createDirectory(at: pendingErrorsDirectory, withIntermediateDirectories: true)
      let files = [
        databaseDirectory.appendingPathComponent("metrics.db"),
        databaseDirectory.appendingPathComponent("metrics.db-wal"),
        pendingErrorsDirectory.appendingPathComponent("error.json"),
      ]
      for file in files {
        try Data("x".utf8).write(to: file)
      }
      let settings = try #require(UserDefaults(suiteName: "dev.expo.app-metrics"))
      settings.set("value", forKey: "deleteStoredDataTest")

      AppMetrics.deleteStoredData(databaseDirectory: databaseDirectory, pendingErrorsDirectory: pendingErrorsDirectory)

      for file in files {
        #expect(!FileManager.default.fileExists(atPath: file.path))
      }
      #expect(settings.object(forKey: "deleteStoredDataTest") == nil)
    }
  }
}

private func withTemporaryDirectory(_ body: (URL) throws -> Void) throws {
  let directory = FileManager.default.temporaryDirectory
    .appendingPathComponent("ObserveConsentTests-\(UUID().uuidString)")
  try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
  defer {
    try? FileManager.default.removeItem(at: directory)
  }
  try body(directory)
}

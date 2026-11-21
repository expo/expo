import Foundation
import Testing
import os

@testable import ExpoAppMetrics

@Suite("ObserveConsent")
struct ObserveConsentTests {
  @Test
  func `absent consent value grants consent`() {
    #expect(ObserveConsent.isGranted(consent: nil))
  }

  @Test
  func `consent value granted grants consent`() {
    #expect(ObserveConsent.isGranted(consent: "granted"))
  }

  @Test
  func `consent value not-granted denies consent`() {
    #expect(!ObserveConsent.isGranted(consent: "not-granted"))
  }

  @Test
  func `unknown consent value denies consent`() {
    #expect(!ObserveConsent.isGranted(consent: "pending"))
    #expect(!ObserveConsent.isGranted(consent: false))
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

@Suite("ObserveConsent saved value")
struct ObserveConsentSavedValueTests {
  @Test
  func `no saved value falls back to the app config`() throws {
    try withTemporaryDirectory { directory in
      #expect(ObserveConsent.readSavedState(at: directory.appendingPathComponent("observe-consent")) == nil)
    }
  }

  @Test
  func `the saved value round-trips`() throws {
    try withTemporaryDirectory { directory in
      let url = directory.appendingPathComponent("ExpoAppMetrics/observe-consent")

      #expect(ObserveConsent.save(granted: false, to: url))
      #expect(ObserveConsent.readSavedState(at: url) == .notGranted)

      #expect(ObserveConsent.save(granted: true, to: url))
      #expect(ObserveConsent.readSavedState(at: url) == .granted)
    }
  }

  @Test
  func `a save to an unwritable location fails`() throws {
    try withTemporaryDirectory { directory in
      // A file in place of the parent directory makes the save fail.
      let file = directory.appendingPathComponent("ExpoAppMetrics")
      try Data("x".utf8).write(to: file)

      #expect(!ObserveConsent.save(granted: false, to: file.appendingPathComponent("observe-consent")))
    }
  }

  @Test
  func `an unreadable saved value makes consent unknown`() throws {
    try withTemporaryDirectory { directory in
      // A directory at the path fails the read with an error other than a missing file.
      #expect(ObserveConsent.readSavedState(at: directory) == .unknown)
    }
  }
}

@Suite("ObserveConsent.Gate")
struct ObserveConsentGateTests {
  // Applies each value in order and returns whether each call changed the gate.
  private func apply(_ values: [Bool], to gate: inout ObserveConsent.Gate) -> [Bool] {
    return values.map { gate.apply(granted: $0) }
  }

  @Test
  func `a call with the current value changes nothing`() {
    var granted = ObserveConsent.Gate(state: .granted)
    var notGranted = ObserveConsent.Gate(state: .notGranted)

    #expect(apply([true], to: &granted) == [false])
    #expect(apply([false], to: &notGranted) == [false])
  }

  @Test
  func `a grant after a revoke changes nothing until the next launch`() {
    var gate = ObserveConsent.Gate(state: .notGranted)

    #expect(apply([true, false, true], to: &gate) == [true, true, false])
    #expect(gate.state == .notGranted)
  }

  @Test
  func `an unknown consent changes on either value`() {
    var revoked = ObserveConsent.Gate(state: .unknown)
    var granted = ObserveConsent.Gate(state: .unknown)

    #expect(apply([false], to: &revoked) == [true])
    #expect(revoked.state == .notGranted)
    #expect(apply([true], to: &granted) == [true])
    #expect(granted.state == .granted)
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

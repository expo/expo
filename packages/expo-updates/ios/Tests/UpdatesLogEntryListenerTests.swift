//  Copyright (c) 2026 650 Industries, Inc. All rights reserved.

import EXUpdatesInterface
import Foundation
import Testing

@testable import EXUpdates

/// Records the entries that the registry delivers. Entries can arrive on any thread.
private final class RecordingListener: UpdatesLogEntryListener, @unchecked Sendable {
  private let lock = NSLock()
  private var receivedEntries: [[String: Any]] = []

  func updatesLogEntryWasLogged(_ entry: [String: Any]) {
    lock.withLock { receivedEntries.append(entry) }
  }

  /// The entries whose message contains `text`. Other tests can log through the same registry.
  func entries(containing text: String) -> [[String: Any]] {
    lock.withLock {
      receivedEntries.filter { ($0["message"] as? String)?.contains(text) == true }
    }
  }
}

@Suite("UpdatesLogEntryListener")
struct UpdatesLogEntryListenerTests {
  private let logger = UpdatesLogger(category: "expo-updates-tests-\(UUID().uuidString)")
  private let marker = UUID().uuidString

  @Test
  func `a logged warning reaches a listener with its fields`() {
    let listener = RecordingListener()
    UpdatesLogEntryListenerRegistry.shared.add(listener)
    defer { UpdatesLogEntryListenerRegistry.shared.remove(listener) }
    let before = UInt(Date().timeIntervalSince1970 * 1000)

    logger.warn(message: "Warning \(marker)", code: .assetsFailedToLoad, updateId: "update-1", assetId: "asset-1")

    let after = UInt(Date().timeIntervalSince1970 * 1000)
    let entries = listener.entries(containing: marker)
    #expect(entries.count == 1)
    let entry = entries.first ?? [:]
    #expect(entry["message"] as? String == "Warning \(marker)")
    #expect(entry["code"] as? String == "AssetsFailedToLoad")
    #expect(entry["level"] as? String == "warn")
    #expect(entry["updateId"] as? String == "update-1")
    #expect(entry["assetId"] as? String == "asset-1")
    let timestamp = entry["timestamp"] as? UInt ?? 0
    #expect(timestamp >= before && timestamp <= after)
  }

  @Test
  func `errors reach a listener and entries below the warning level do not`() {
    let listener = RecordingListener()
    UpdatesLogEntryListenerRegistry.shared.add(listener)
    defer { UpdatesLogEntryListenerRegistry.shared.remove(listener) }

    logger.info(message: "Info \(marker)")
    logger.debug(message: "Debug \(marker)")
    logger.error(cause: UpdatesError.errorRecoveryFatalException(serializedError: "Error \(marker)"), code: .updateFailedToLoad)

    #expect(listener.entries(containing: marker).compactMap { $0["level"] as? String } == ["error"])
  }

  @Test
  func `a removed listener gets no entries`() {
    let listener = RecordingListener()
    UpdatesLogEntryListenerRegistry.shared.add(listener)
    UpdatesLogEntryListenerRegistry.shared.remove(listener)

    logger.warn(message: "Warning \(marker)", code: .none)

    #expect(listener.entries(containing: marker).isEmpty)
  }

  @Test
  func `the registry does not keep a listener alive`() {
    weak var released: RecordingListener?
    do {
      let listener = RecordingListener()
      released = listener
      UpdatesLogEntryListenerRegistry.shared.add(listener)
    }

    #expect(released == nil)
    logger.warn(message: "Warning \(marker)", code: .none)
  }

  @Test
  func `entries logged from several threads all reach a listener`() {
    let listener = RecordingListener()
    UpdatesLogEntryListenerRegistry.shared.add(listener)
    defer { UpdatesLogEntryListenerRegistry.shared.remove(listener) }

    DispatchQueue.concurrentPerform(iterations: 100) { index in
      logger.warn(message: "Warning \(marker) \(index)", code: .none)
    }

    #expect(listener.entries(containing: marker).count == 100)
  }
}

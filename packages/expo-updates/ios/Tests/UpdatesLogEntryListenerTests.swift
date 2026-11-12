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
    UpdatesLogEntryListenerRegistry.sharedInstance.add(listener)
    defer { UpdatesLogEntryListenerRegistry.sharedInstance.remove(listener) }
    let before = UInt(Date().timeIntervalSince1970 * 1000)

    logger.warn(
      .remoteAssetDownloadFailed,
      values: ["assetKey": "asset-1", "cause": "Warning \(marker)"],
      updateId: "update-1",
      assetId: "asset-1"
    )

    let after = UInt(Date().timeIntervalSince1970 * 1000)
    let entries = listener.entries(containing: marker)
    #expect(entries.count == 1)
    let entry = entries.first ?? [:]
    #expect(entry["message"] as? String == "Failed to download asset asset-1: Warning \(marker)")
    #expect(entry["code"] as? String == "AssetsFailedToLoad")
    #expect(entry["key"] as? String == "remote.assetDownloadFailed")
    #expect(entry["values"] as? [String: String] == ["assetKey": "asset-1", "cause": "Warning \(marker)"])
    #expect(entry["level"] as? String == "warn")
    #expect(entry["updateId"] as? String == "update-1")
    #expect(entry["assetId"] as? String == "asset-1")
    let timestamp = entry["timestamp"] as? UInt ?? 0
    #expect(timestamp >= before && timestamp <= after)
  }

  @Test
  func `errors reach a listener and entries below the warning level do not`() {
    let listener = RecordingListener()
    UpdatesLogEntryListenerRegistry.sharedInstance.add(listener)
    defer { UpdatesLogEntryListenerRegistry.sharedInstance.remove(listener) }

    logger.info(message: "Info \(marker)")
    logger.debug(message: "Debug \(marker)")
    logger.error(.remoteFetchFailed, values: ["cause": "Error \(marker)"])

    #expect(listener.entries(containing: marker).compactMap { $0["level"] as? String } == ["error"])
  }

  @Test
  func `a removed listener gets no entries`() {
    let listener = RecordingListener()
    UpdatesLogEntryListenerRegistry.sharedInstance.add(listener)
    UpdatesLogEntryListenerRegistry.sharedInstance.remove(listener)

    logger.warn(.reaperFailed, values: ["cause": "Warning \(marker)"])

    #expect(listener.entries(containing: marker).isEmpty)
  }

  @Test
  func `the registry keeps a listener alive until it is removed`() {
    weak var weakListener: RecordingListener?
    do {
      let listener = RecordingListener()
      weakListener = listener
      UpdatesLogEntryListenerRegistry.sharedInstance.add(listener)
    }

    logger.warn(.reaperFailed, values: ["cause": "Warning \(marker)"])
    #expect(weakListener?.entries(containing: marker).count == 1)

    if let listener = weakListener {
      UpdatesLogEntryListenerRegistry.sharedInstance.remove(listener)
    }
    #expect(weakListener == nil)
  }

  @Test
  func `entries logged from several threads all reach a listener`() {
    let listener = RecordingListener()
    UpdatesLogEntryListenerRegistry.sharedInstance.add(listener)
    defer { UpdatesLogEntryListenerRegistry.sharedInstance.remove(listener) }

    DispatchQueue.concurrentPerform(iterations: 100) { index in
      logger.warn(.reaperFailed, values: ["cause": "Warning \(marker) \(index)"])
    }

    #expect(listener.entries(containing: marker).count == 100)
  }
}

@Suite("UpdatesLogEntryForwarder")
struct UpdatesLogEntryForwarderTests {
  private let marker = UUID().uuidString

  @Test
  func `sends registry entries only while it is enabled`() {
    let sent = RecordingListener()
    let forwarder = UpdatesLogEntryForwarder { entry in sent.updatesLogEntryWasLogged(entry) }

    UpdatesLogEntryListenerRegistry.sharedInstance.notify(["message": "before \(marker)"])
    forwarder.setEnabled(true)
    UpdatesLogEntryListenerRegistry.sharedInstance.notify(["message": "enabled \(marker)"])
    forwarder.setEnabled(false)
    UpdatesLogEntryListenerRegistry.sharedInstance.notify(["message": "after \(marker)"])

    let messages = sent.entries(containing: marker).compactMap { $0["message"] as? String }
    #expect(messages == ["enabled \(marker)"])
  }
}

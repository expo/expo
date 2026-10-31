import EXUpdatesInterface
import Foundation
import Testing

@testable import ExpoObserve

/// Records the entries that the forwarder sends. Entries can arrive on any thread.
private final class SentEntries: @unchecked Sendable {
  private let lock = NSLock()
  private var entries: [[String: Any]] = []

  func append(_ entry: [String: Any]) {
    lock.withLock { entries.append(entry) }
  }

  func messages(containing text: String) -> [String] {
    lock.withLock {
      entries.compactMap { $0["message"] as? String }.filter { $0.contains(text) }
    }
  }
}

@Suite("ExpoUpdatesLogForwarder")
struct ExpoUpdatesLogForwarderTests {
  private let marker = UUID().uuidString

  @Test
  func `sends registry entries only while it is enabled`() {
    let sent = SentEntries()
    let forwarder = ExpoUpdatesLogForwarder { entry in sent.append(entry) }

    UpdatesLogEntryListenerRegistry.sharedInstance.notify(["message": "before \(marker)"])
    forwarder.setEnabled(true)
    UpdatesLogEntryListenerRegistry.sharedInstance.notify(["message": "enabled \(marker)"])
    forwarder.setEnabled(false)
    UpdatesLogEntryListenerRegistry.sharedInstance.notify(["message": "after \(marker)"])

    #expect(sent.messages(containing: marker) == ["enabled \(marker)"])
  }
}

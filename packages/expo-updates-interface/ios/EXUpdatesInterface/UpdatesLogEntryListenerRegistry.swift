//  Copyright © 2026-present 650 Industries. All rights reserved.

import Foundation

/// Receives expo-updates log entries at the warning level or higher as they are logged. An entry has
/// the same fields as the entries that `readLogEntriesAsync` returns: `timestamp`, `message`, `code`,
/// `level`, and optionally `updateId`, `assetId`, `stacktrace`, and `duration`.
public protocol UpdatesLogEntryListener: AnyObject {
  /// Called on the thread that logged the entry.
  func updatesLogEntryWasLogged(_ entry: [String: Any])
}

/// Delivers expo-updates log entries to listeners in the same process, so other modules can report
/// them without reading the log file. It does not depend on whether updates are enabled. The
/// registry keeps each listener alive until `remove` is called with it.
public final class UpdatesLogEntryListenerRegistry: @unchecked Sendable {
  public static let sharedInstance = UpdatesLogEntryListenerRegistry()

  private let lock = NSLock()
  private var listeners: [ObjectIdentifier: UpdatesLogEntryListener] = [:]

  public func add(_ listener: UpdatesLogEntryListener) {
    lock.withLock {
      listeners[ObjectIdentifier(listener)] = listener
    }
  }

  public func remove(_ listener: UpdatesLogEntryListener) {
    lock.withLock {
      listeners[ObjectIdentifier(listener)] = nil
    }
  }

  /// Delivers the entry to each listener outside the lock, so a listener can add or remove listeners.
  public func notify(_ entry: [String: Any]) {
    let currentListeners = lock.withLock { Array(listeners.values) }
    for listener in currentListeners {
      listener.updatesLogEntryWasLogged(entry)
    }
  }
}

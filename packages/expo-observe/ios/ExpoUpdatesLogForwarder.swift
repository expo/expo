// Copyright 2026-present 650 Industries. All rights reserved.

import EXUpdatesInterface

/// Sends the expo-updates log entries from `UpdatesLogEntryListenerRegistry` to `send` while it is
/// enabled. The expo-updates integration in JS turns it on, so the module listens only while the
/// integration runs.
internal final class ExpoUpdatesLogForwarder: UpdatesLogEntryListener {
  private let send: ([String: Any]) -> Void

  init(send: @escaping ([String: Any]) -> Void) {
    self.send = send
  }

  func setEnabled(_ enabled: Bool) {
    if enabled {
      UpdatesLogEntryListenerRegistry.sharedInstance.add(self)
    } else {
      UpdatesLogEntryListenerRegistry.sharedInstance.remove(self)
    }
  }

  func updatesLogEntryWasLogged(_ entry: [String: Any]) {
    send(entry)
  }
}

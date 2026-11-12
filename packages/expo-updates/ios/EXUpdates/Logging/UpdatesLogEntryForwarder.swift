// Copyright 2026-present 650 Industries. All rights reserved.

import EXUpdatesInterface

/// Sends the log entries from `UpdatesLogEntryListenerRegistry` to `send` while it is enabled.
/// `UpdatesModule` enables it while JS listens for log entries.
internal final class UpdatesLogEntryForwarder: UpdatesLogEntryListener {
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

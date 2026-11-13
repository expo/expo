// Copyright 2025-present 650 Industries. All rights reserved.

import os

internal let logger = ObserveLogger()

/// Keeps the subsystem, category, level prefixes and line splitting of the ExpoModulesCore logger
/// it replaces, so device logs and Console filters stay the same.
internal struct ObserveLogger: Sendable {
  private let osLogger = os.Logger(subsystem: "dev.expo.modules", category: "expo")

  func debug(_ message: String) {
    #if DEBUG
    log(.debug, prefix: "🔵", message)
    #endif
  }

  func info(_ message: String) {
    log(.info, prefix: "🟢", message)
  }

  func warn(_ message: String) {
    log(.default, prefix: "🟡", message)
  }

  func error(_ message: String) {
    log(.error, prefix: "🟠", message)
  }

  private func log(_ level: OSLogType, prefix: String, _ message: String) {
    for line in message.split(whereSeparator: \.isNewline) {
      // One interpolated string, so the line has the same (default) privacy as in the old logger.
      osLogger.log(level: level, "\("\(prefix) \(line)")")
    }
  }
}

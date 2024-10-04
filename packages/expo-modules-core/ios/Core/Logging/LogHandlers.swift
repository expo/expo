// Copyright 2022-present 650 Industries. All rights reserved.

import os.log

/**
 The protocol that needs to be implemented by log handlers.
 */
internal protocol LogHandler {
  init(category: String)

  func log(type: LogType, _ message: String)
}

/**
 The log handler that uses the new `os.Logger` API.
 */
@available(macOS 11.0, iOS 14.0, watchOS 7.0, tvOS 14.0, *)
internal class OSLogHandler: LogHandler {
  private let osLogger: os.Logger

  required init(category: String) {
    osLogger = os.Logger(subsystem: Logger.EXPO_MODULES_LOG_SUBSYSTEM, category: category)
  }

  func log(type: LogType, _ message: String) {
    osLogger.log(level: type.toOSLogType(), "\(message)")
  }
}

/**
 Simple log handler that forwards all logs to `print` function.
 */
internal class PrintLogHandler: LogHandler {
  required init(category: String) {}

  func log(type: LogType, _ message: String) {
    print(message)
  }
}

/**
 Log handler that writes all logs to a file using PersistentFileLog
 */
internal class PersistentFileLogHandler: LogHandler {
  private let persistentLog: PersistentFileLog

  required init(category: String) {
    self.persistentLog = PersistentFileLog(category: category)
  }

  func log(type: LogType, _ message: String) {
    persistentLog.appendEntry(entry: message)
  }
}

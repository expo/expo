// Copyright 2022-present 650 Industries. All rights reserved.

// swiftlint:disable function_parameter_count

import ExpoModulesCore
import Foundation
import os.log

/// Class that implements logging for expo-updates in its own os.log category
@objc(EXUpdatesLogger)
@objcMembers
public final class UpdatesLogger: NSObject {
  static let EXPO_UPDATES_LOG_CATEGORY = "expo-updates"

  /// The os.log category and `PersistentFileLog` file suffix this logger writes to. Exposed so
  /// callers reading back logs (and tests) can construct a matching `UpdatesLogReader` /
  /// `PersistentFileLog` instance against the same file.
  internal let category: String

  private let logger: ExpoModulesCore.Logger

  public override init() {
    self.category = UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY
    self.logger = Logger(logHandlers: [
      createOSLogHandler(category: UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY),
      createPersistentFileLogHandler(category: UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY),
    ])
    super.init()
  }

  /// Internal initializer that lets tests redirect the log file by passing a unique category.
  /// Two `PersistentFileLog` instances with the same category share an on-disk file at
  /// `<AppSupport>/dev.expo.modules.core.logging.<category>.txt`; using a per-test category
  /// keeps test runs from colliding with each other or with production callers.
  internal init(category: String) {
    self.category = category
    self.logger = Logger(logHandlers: [
      createOSLogHandler(category: category),
      createPersistentFileLogHandler(category: category),
    ])
    super.init()
  }

  // MARK: - Public logging functions

  func trace(
    message: String,
    code: UpdatesErrorCode = .none,
    updateId: String?,
    assetId: String?
  ) {
    let entry = logEntryString(
      message: message, code: code, level: .trace,
      duration: nil, updateId: updateId, assetId: assetId
    )
    logger.trace(entry)
  }

  func trace(
    message: String,
    code: UpdatesErrorCode = .none
  ) {
    trace(message: message, code: code, updateId: nil, assetId: nil)
  }

  func trace(message: String) {
    trace(message: message, code: .none)
  }

  func debug(
    message: String,
    code: UpdatesErrorCode = .none,
    updateId: String?,
    assetId: String?
  ) {
    let entry = logEntryString(
      message: message, code: code, level: .debug,
      duration: nil, updateId: updateId, assetId: assetId
    )
    logger.debug(entry)
  }

  func debug(
    message: String,
    code: UpdatesErrorCode = .none
  ) {
    debug(message: message, code: code, updateId: nil, assetId: nil)
  }

  func debug(message: String) {
    debug(message: message, code: .none)
  }

  func info(
    message: String,
    code: UpdatesErrorCode = .none,
    updateId: String?,
    assetId: String?
  ) {
    let entry = logEntryString(
      message: message, code: code, level: .info,
      duration: nil, updateId: updateId, assetId: assetId
    )
    logger.info(entry)
  }

  func info(
    message: String,
    code: UpdatesErrorCode = .none
  ) {
    info(message: message, code: code, updateId: nil, assetId: nil)
  }

  func info(message: String) {
    info(message: message, code: .none)
  }

  func warn(
    message: String,
    code: UpdatesErrorCode = .none,
    updateId: String?,
    assetId: String?
  ) {
    let entry = logEntryString(
      message: message, code: code, level: .warn,
      duration: nil, updateId: updateId, assetId: assetId
    )
    logger.warn(entry)
  }

  func warn(
    message: String,
    code: UpdatesErrorCode = .none
  ) {
    warn(message: message, code: code, updateId: nil, assetId: nil)
  }

  func warn(message: String) {
    warn(message: message, code: .none)
  }

  func error(
    cause: UpdatesError,
    code: UpdatesErrorCode = .none,
    updateId: String?,
    assetId: String?
  ) {
    let entry = logEntryString(
      message: cause.localizedDescription, code: code, level: .error,
      duration: nil, updateId: updateId, assetId: assetId
    )
    logger.error(entry)
  }

  func error(
    cause: UpdatesError,
    code: UpdatesErrorCode = .none
  ) {
    error(cause: cause, code: code, updateId: nil, assetId: nil)
  }

  func fatal(
    cause: UpdatesError,
    code: UpdatesErrorCode = .none,
    updateId: String?,
    assetId: String?
  ) {
    let entry = logEntryString(
      message: cause.localizedDescription, code: code, level: .fatal,
      duration: nil, updateId: updateId, assetId: assetId
    )
    logger.fatal(entry)
  }

  func fatal(
    cause: UpdatesError,
    code: UpdatesErrorCode = .none
  ) {
    fatal(cause: cause, code: code, updateId: nil, assetId: nil)
  }

  func startTimer(label: String) -> LoggerTimer {
    return logger.startTimer { duration in
      self.logEntryString(message: label, code: .none, level: .timer, duration: duration, updateId: nil, assetId: nil)
    }
  }

  func logEntryString(
    message: String,
    code: UpdatesErrorCode,
    level: LogType,
    duration: Double?,
    updateId: String?,
    assetId: String?
  ) -> String {
    // Get stacktrace:
    // - Only for log level error or fatal
    // - Since this is called by a public method above, drop this frame
    //   and the one below
    let symbols = (level == .error || level == .fatal) ? UpdatesLogEntry.currentStackTrace() : nil
    let logEntry = UpdatesLogEntry(
      timestamp: UInt(Date().timeIntervalSince1970) * 1000,
      message: message,
      code: code.asString,
      level: "\(level)",
      updateId: updateId,
      assetId: assetId,
      stacktrace: symbols,
      duration: duration
    )
    return "\(logEntry.asString() ?? logEntry.message)"
  }
}

// swiftlint:enable function_parameter_count

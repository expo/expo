// Copyright 2022-present 650 Industries. All rights reserved.

import Foundation
import os.log

import ExpoModulesCore

/**
 Class that implements logging for expo-updates in its own os.log category
 */
@objc(EXUpdatesLogger)
public class UpdatesLogger: NSObject {
  public static let EXPO_UPDATES_LOG_CATEGORY = "expo-updates"

  private let logger = Logger(category: UpdatesLogger.EXPO_UPDATES_LOG_CATEGORY, options: [.logToOS, .logToFile])

  // MARK: - Public logging functions

  @objc(trace:code:updateId:assetId:)
  public func trace(
    message: String,
    code: UpdatesErrorCode = .none,
    updateId: String?,
    assetId: String?
  ) {
    let entry = logEntryString(message: message, code: code, level: .trace, updateId: updateId, assetId: assetId)
    logger.trace(entry)
  }

  @objc(trace:code:)
  public func trace(
    message: String,
    code: UpdatesErrorCode = .none
  ) {
    trace(message: message, code: code, updateId: nil, assetId: nil)
  }

  @objc(trace:)
  public func trace(message: String) {
    trace(message: message, code: .none)
  }

  @objc(debug:code:updateId:assetId:)
  public func debug(
    message: String,
    code: UpdatesErrorCode = .none,
    updateId: String?,
    assetId: String?
  ) {
    let entry = logEntryString(message: message, code: code, level: .debug, updateId: updateId, assetId: assetId)
    logger.debug(entry)
  }

  @objc(debug:code:)
  public func debug(
    message: String,
    code: UpdatesErrorCode = .none
  ) {
    debug(message: message, code: code, updateId: nil, assetId: nil)
  }

  @objc(debug:)
  public func debug(message: String) {
    debug(message: message, code: .none)
  }

  @objc(info:code:updateId:assetId:)
  public func info(
    message: String,
    code: UpdatesErrorCode = .none,
    updateId: String?,
    assetId: String?
  ) {
    let entry = logEntryString(message: message, code: code, level: .info, updateId: updateId, assetId: assetId)
    logger.info(entry)
  }

  @objc(info:code:)
  public func info(
    message: String,
    code: UpdatesErrorCode = .none
  ) {
    info(message: message, code: code, updateId: nil, assetId: nil)
  }

  @objc(info:)
  public func info(message: String) {
    info(message: message, code: .none)
  }

  @objc(warn:code:updateId:assetId:)
  public func warn(
    message: String,
    code: UpdatesErrorCode = .none,
    updateId: String?,
    assetId: String?
  ) {
    let entry = logEntryString(message: message, code: code, level: .warn, updateId: updateId, assetId: assetId)
    logger.warn(entry)
  }

  @objc(warn:code:)
  public func warn(
    message: String,
    code: UpdatesErrorCode = .none
  ) {
    warn(message: message, code: code, updateId: nil, assetId: nil)
  }

  @objc(warn:)
  public func warn(message: String) {
    warn(message: message, code: .none)
  }

  @objc(error:code:updateId:assetId:)
  public func error(
    message: String,
    code: UpdatesErrorCode = .none,
    updateId: String?,
    assetId: String?
  ) {
    let entry = logEntryString(message: message, code: code, level: .error, updateId: updateId, assetId: assetId)
    logger.error(entry)
  }

  @objc(error:code:)
  public func error(
    message: String,
    code: UpdatesErrorCode = .none
  ) {
    error(message: message, code: code, updateId: nil, assetId: nil)
  }

  @objc(fatal:code:updateId:assetId:)
  public func fatal(
    message: String,
    code: UpdatesErrorCode = .none,
    updateId: String?,
    assetId: String?
  ) {
    let entry = logEntryString(message: message, code: code, level: .fatal, updateId: updateId, assetId: assetId)
    logger.fatal(entry)
  }

  @objc(fatal:code:)
  public func fatal(
    message: String,
    code: UpdatesErrorCode = .none
  ) {
    fatal(message: message, code: code, updateId: nil, assetId: nil)
  }

  public func logEntryString(
    message: String,
    code: UpdatesErrorCode = .none,
    level: LogType = .trace,
    updateId: String?,
    assetId: String?
  ) -> String {
    // Get stacktrace:
    // - Only for log level error or fatal
    // - Since this is called by a public method above, drop this frame
    //   and the one below
    let symbols = (level == .error || level == .fatal) ? UpdatesLogEntry.currentStackTrace() : nil
    let logEntry = UpdatesLogEntry(
      timestamp: UInt(Date().timeIntervalSince1970) * 1_000,
      message: message,
      code: code.asString,
      level: "\(level)",
      updateId: updateId,
      assetId: assetId,
      stacktrace: symbols
    )
    return "\(logEntry.asString() ?? logEntry.message)"
  }
}

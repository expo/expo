// Copyright 2022-present 650 Industries. All rights reserved.

// Class that implements logging for expo-updates in its own os.log category

import Foundation
import os.log

import ExpoModulesCore

internal class CoreLogger: ExpoModulesCore.Logger {
  override func messages(type: LogType = .trace, _ items: [Any]) -> [String] {
    return items
      .map { describe(value: $0) }
      .joined(separator: " ")
      .split(whereSeparator: \.isNewline)
      .map { "\($0)" }
  }
}

@available(macOS 12.0, iOS 15.0, watchOS 8.0, tvOS 15.0, *)
@objc(EXUpdatesLogger)
public class UpdatesLogger: NSObject {

  private let logger: CoreLogger

  public static let LOG_CATEGORY = "expo-updates"

  public override init() {
    logger = CoreLogger(category: UpdatesLogger.LOG_CATEGORY)
  }

  // MARK: - Public logging functions

  @objc(trace:code:updateId:assetId:)
  public func trace(
    message: String,
    code: UpdatesErrorCode = .None,
    updateId: String?,
    assetId: String?
  ) {
    let entry = logEntryMessage(message: message, code: code, level: .trace, updateId: updateId, assetId: assetId)
    logger.trace(entry)
  }

  @objc(trace:code:)
  public func trace(
    message: String,
    code: UpdatesErrorCode = .None
  ) {
    trace(message: message, code: code, updateId: nil, assetId: nil)
  }

  @objc(debug:code:updateId:assetId:)
  public func debug(
    message: String,
    code: UpdatesErrorCode = .None,
    updateId: String?,
    assetId: String?
  ) {
    let entry = logEntryMessage(message: message, code: code, level: .debug, updateId: updateId, assetId: assetId)
    logger.debug(entry)
  }

  @objc(debug:code:)
  public func debug(
    message: String,
    code: UpdatesErrorCode = .None
  ) {
    debug(message: message, code: code, updateId: nil, assetId: nil)
  }

  @objc(info:code:updateId:assetId:)
  public func info(
    message: String,
    code: UpdatesErrorCode = .None,
    updateId: String?,
    assetId: String?
  ) {
    let entry = logEntryMessage(message: message, code: code, level: .info, updateId: updateId, assetId: assetId)
    logger.info(entry)
  }

  @objc(info:code:)
  public func info(
    message: String,
    code: UpdatesErrorCode = .None
  ) {
    info(message: message, code: code, updateId: nil, assetId: nil)
  }

  @objc(warn:code:updateId:assetId:)
  public func warn(
    message: String,
    code: UpdatesErrorCode = .None,
    updateId: String?,
    assetId: String?
  ) {
    let entry = logEntryMessage(message: message, code: code, level: .warn, updateId: updateId, assetId: assetId)
    logger.warn(entry)
  }

  @objc(warn:code:)
  public func warn(
    message: String,
    code: UpdatesErrorCode = .None
  ) {
    warn(message: message, code: code, updateId: nil, assetId: nil)
  }

  @objc(error:code:updateId:assetId:)
  public func error(
    message: String,
    code: UpdatesErrorCode = .None,
    updateId: String?,
    assetId: String?
  ) {
    let entry = logEntryMessage(message: message, code: code, level: .error, updateId: updateId, assetId: assetId)
    logger.error(entry)
  }

  @objc(error:code:)
  public func error(
    message: String,
    code: UpdatesErrorCode = .None
  ) {
    error(message: message, code: code, updateId: nil, assetId: nil)
  }

  @objc(fatal:code:updateId:assetId:)
  public func fatal(
    message: String,
    code: UpdatesErrorCode = .None,
    updateId: String?,
    assetId: String?
  ) {
    let entry = logEntryMessage(message: message, code: code, level: .fatal, updateId: updateId, assetId: assetId)
    logger.fatal(entry)
  }

  @objc(fatal:code:)
  public func fatal(
    message: String,
    code: UpdatesErrorCode = .None
  ) {
    fatal(message: message, code: code, updateId: nil, assetId: nil)
  }

  // MARK: - Private methods

  func logEntryMessage(
    message: String,
    code: UpdatesErrorCode = .None,
    level: ExpoModulesCore.LogType = .trace,
    updateId: String?,
    assetId: String?
  ) -> String{
    // Get stacktrace:
    // - Only for log level error or fatal
    // - Since this is called by a public method above, drop this frame
    //   and the one below
    let symbols = (level == .error || level == .fatal) ? ( Thread.callStackSymbols.dropFirst().dropFirst().map { s in
      s.replacingOccurrences(of: #"^\d+\s+"#, with: "", options: .regularExpression)
    }
    ) : nil

    let logEntry = UpdatesLogEntry(
      timestamp: UInt(Date().timeIntervalSince1970),
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

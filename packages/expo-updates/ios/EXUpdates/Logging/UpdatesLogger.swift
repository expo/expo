// Copyright 2022-present 650 Industries. All rights reserved.

// swiftlint:disable function_parameter_count

import EXUpdatesInterface
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

  // MARK: - Logging by message key

  /**
   Logs a warning with the key and template of `message`. The template is filled from `values`, and
   from `cause` for its `{cause}` placeholder when `values` has no `cause`.
   */
  func warn(
    _ message: UpdatesLogMessage,
    cause: Error? = nil,
    values: [String: String] = [:],
    updateId: String? = nil,
    assetId: String? = nil
  ) {
    logger.warn(logEntryString(
      message, cause: cause, values: values, level: .warn, updateId: updateId, assetId: assetId
    ))
  }

  /**
   Logs an error with the key and template of `message`, filled as for `warn`.
   */
  func error(
    _ message: UpdatesLogMessage,
    cause: Error? = nil,
    values: [String: String] = [:],
    updateId: String? = nil,
    assetId: String? = nil
  ) {
    logger.error(logEntryString(
      message, cause: cause, values: values, level: .error, updateId: updateId, assetId: assetId
    ))
  }

  /**
   Logs a failed update load with `unreachable` when the device could not reach the server, and
   with `failed` for any other failure. When assets of the update failed to load, logs one error
   for each group of asset failures with the same key and HTTP status instead, so that one kind of
   failure does not hide another. Those errors always have the `remote.assetsFailed` or
   `remote.assetsUnreachable` key, whatever `failed` and `unreachable` are. A code signing failure
   is not logged again: the file downloader logs it as `systemCodeSigningVerificationFailed`.
   */
  func errorForLoadFailure(
    _ error: Error,
    failed: UpdatesLogMessage,
    unreachable: UpdatesLogMessage,
    updateId: String? = nil
  ) {
    if isCodeSigningFailure(error) {
      return
    }
    guard let failures = assetLoadFailures(in: error) else {
      self.error(
        UpdatesLogMessage.forLoadFailure(error, failed: failed, unreachable: unreachable),
        cause: error,
        updateId: updateId
      )
      return
    }
    for group in UpdatesLogMessage.groups(of: failures) {
      var values = [
        "count": String(group.failures.count),
        "assetKeys": UpdatesLogger.assetKeysValue(group.failures.map { $0.assetKey })
      ]
      if let httpStatus = group.httpStatus {
        values["httpStatus"] = String(httpStatus)
      }
      self.error(group.message, cause: group.failures.first?.error, values: values, updateId: updateId)
    }
  }

  private static let maxListedAssetKeys = 5

  /**
   The keys of a list of assets as log values and messages show it: the first few keys, then the
   number of keys left out.
   */
  static func assetKeysValue(_ assetKeys: [String]) -> String {
    let listedKeys = assetKeys.prefix(maxListedAssetKeys).joined(separator: ", ")
    let moreKeys = assetKeys.count > maxListedAssetKeys ? ", and \(assetKeys.count - maxListedAssetKeys) more" : ""
    return listedKeys + moreKeys
  }

  /**
   Fills each `{name}` placeholder in `template` with `values[name]`. A placeholder with no value
   stays as it is.
   */
  static func fill(_ template: String, with values: [String: String]) -> String {
    var result = ""
    var rest = template[...]
    while let open = rest.firstIndex(of: "{"), let close = rest[open...].firstIndex(of: "}") {
      result += rest[..<open]
      let name = String(rest[rest.index(after: open)..<close])
      result += values[name] ?? String(rest[open...close])
      rest = rest[rest.index(after: close)...]
    }
    return result + rest
  }

  private func isCodeSigningFailure(_ error: Error) -> Bool {
    var current: Error? = error
    while let error = current {
      switch error as? UpdatesError {
      case .fileDownloaderCodeSigningError?,
        .fileDownloaderCodeSigningUnknownError?,
        .fileDownloaderCodeSigningIncorrectSignature?,
        .fileDownloaderCodeSigningCertificateScopeKeyOrProjectIdMismatch?:
        return true
      default:
        current = (error as? UpdatesError)?.cause
      }
    }
    return false
  }

  private func assetLoadFailures(in error: Error) -> [AssetLoadFailure]? {
    var current: Error? = error
    while let error = current {
      if case let .appLoaderFailedToLoadAllAssets(failures)? = error as? UpdatesError {
        return failures
      }
      current = (error as? UpdatesError)?.cause
    }
    return nil
  }

  func startTimer(label: String) -> LoggerTimer {
    return logger.startTimer { duration in
      self.logEntryString(message: label, code: .none, level: .timer, duration: duration, updateId: nil, assetId: nil)
    }
  }

  private func logEntryString(
    _ message: UpdatesLogMessage,
    cause: Error?,
    values: [String: String],
    level: LogType,
    updateId: String?,
    assetId: String?
  ) -> String {
    var values = values
    if let cause, values["cause"] == nil {
      values["cause"] = cause.localizedDescription
    }
    // Only for error and fatal logs
    let symbols = (level == .error || level == .fatal) ? UpdatesLogEntry.currentStackTrace() : nil
    let logEntry = UpdatesLogEntry(
      timestamp: UInt(Date().timeIntervalSince1970 * 1000),
      message: UpdatesLogger.fill(message.template, with: values),
      code: message.code.asString,
      level: "\(level)",
      updateId: updateId,
      assetId: assetId,
      stacktrace: symbols,
      duration: nil,
      key: message.rawValue,
      values: values.isEmpty ? nil : values
    )
    notifyListeners(logEntry, level: level)
    return logEntry.asString() ?? logEntry.message
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
      timestamp: UInt(Date().timeIntervalSince1970 * 1000),
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

  private func notifyListeners(_ logEntry: UpdatesLogEntry, level: LogType) {
    if level == .warn || level == .error || level == .fatal {
      UpdatesLogEntryListenerRegistry.sharedInstance.notify(logEntry.asDict())
    }
  }
}

// swiftlint:enable function_parameter_count

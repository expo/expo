// Copyright 2026-present 650 Industries. All rights reserved.

import EXUpdatesInterface
import ExpoObserveInterface

/// Reports the errors that expo-updates logs, and its warnings when `reportWarnings` is set. It listens to
/// `UpdatesLogEntryListenerRegistry`, which gets each entry at the warning level or higher as expo-updates logs it,
/// so expo-updates needs no code for Observe.
internal final class ExpoUpdatesIntegration: ObserveIntegration {
  let name = "expo-updates"

  func setup(config: [String: Any], observe: any ObserveClient) throws -> (() -> Void)? {
    let listener = ExpoUpdatesLogListener(config: config, observe: observe)
    UpdatesLogEntryListenerRegistry.sharedInstance.add(listener)
    return {
      UpdatesLogEntryListenerRegistry.sharedInstance.remove(listener)
    }
  }
}

internal final class ExpoUpdatesLogListener: UpdatesLogEntryListener, Sendable {
  static let errorType = "updates.error"
  static let errorRecoveryType = "updates.error_recovery"
  static let warningName = "updates.warning"

  /// The key of the entry that expo-updates logs for a JS error that error recovery handles. Error recovery can end
  /// the process right after this entry, so the error is written to disk at once.
  ///
  /// A fatal JS error that the global error handler records also gets this entry, so it has two records.
  /// This record is kept, because it is the only record of an error before expo-observe loads, or while
  /// `errorHandlingEnabled` is `false`.
  static let errorRecoveryKey = UpdatesLogMessage.errorRecoveryJsException.rawValue
  /// The key of the entry that expo-updates logs just before error recovery crashes the app. Observe reports the
  /// crash, and the entry of `errorRecoveryKey` reports the error that started error recovery, so this entry is not
  /// reported.
  static let errorRecoveryCrashKey = UpdatesLogMessage.errorRecoveryCrash.rawValue

  private let observe: any ObserveClient
  private let reportWarnings: Bool
  private let ignoredKeys: Set<String>

  init(config: [String: Any], observe: any ObserveClient) {
    self.observe = observe
    self.reportWarnings = config["reportWarnings"] as? Bool ?? false
    self.ignoredKeys = Set((config["ignoredKeys"] as? [Any])?.compactMap { $0 as? String } ?? [])
  }

  func updatesLogEntryWasLogged(_ entry: [String: Any]) {
    guard let message = entry["message"] as? String,
      let code = entry["code"] as? String,
      let level = entry["level"] as? String
    else {
      return
    }
    let key = entry["key"] as? String
    if let key, key == Self.errorRecoveryCrashKey || ignoredKeys.contains(key) {
      return
    }
    if level == "error" || level == "fatal" {
      if key == Self.errorRecoveryKey {
        observe.reportError(
          ObserveErrorReport(
            type: Self.errorRecoveryType,
            message: message,
            code: code,
            persistImmediately: true
          )
        )
        return
      }
      // The code leads the message, so the error list in the dashboard shows it.
      observe.reportError(ObserveErrorReport(type: Self.errorType, message: "\(code): \(message)", code: code))
      return
    }
    if level == "warn" && reportWarnings {
      var attributes: [String: ObserveAttributeValue] = [:]
      if let key {
        attributes["key"] = .string(key)
      }
      if let updateId = entry["updateId"] as? String {
        attributes["updateId"] = .string(updateId)
      }
      if let assetId = entry["assetId"] as? String {
        attributes["assetId"] = .string(assetId)
      }
      observe.reportWarning(
        ObserveWarningReport(
          name: Self.warningName,
          displayName: "Updates warning",
          message: message,
          code: code,
          attributes: attributes
        )
      )
    }
  }
}

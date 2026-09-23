// Copyright 2022-present 650 Industries. All rights reserved.

// swiftlint:disable line_length

import ExpoModulesCore

public final class UpdatesDisabledException: Exception {
  private let jsMethodName: String

  public init(_ jsMethodName: String, file: String = #fileID, line: UInt = #line, function: String = #function) {
    self.jsMethodName = jsMethodName
    super.init(file: file, line: line, function: function)
  }

  public override var code: String {
    "ERR_UPDATES_DISABLED"
  }

  public override var reason: String {
    "\(jsMethodName) is not supported when expo-updates is not enabled."
  }
}

internal final class UpdatesNotInitializedException: Exception {
  override var code: String {
    "ERR_UPDATES_DISABLED"
  }

  override var reason: String {
    "The updates module controller has not been properly initialized. If you're in development mode, you cannot use this method. Otherwise, make sure you have called AppController.sharedInstance.start()"
  }
}

public final class UpdatesReloadException: Exception {
  public override var code: String {
    "ERR_UPDATES_RELOAD"
  }

  public override var reason: String {
    "Could not reload application. Ensure you have set the `appContext` property of AppController."
  }
}

internal final class UpdatesUnsupportedDirectiveException: Exception {
  override var code: String {
    "ERR_UPDATES_UNSUPPORTED_DIRECTIVE"
  }

  override var reason: String {
    "Updates service response included a directive that this client does not support."
  }
}

internal final class NotAvailableInDevClientException: Exception {
  private let jsMethodName: String

  internal init(_ jsMethodName: String, file: String = #fileID, line: UInt = #line, function: String = #function) {
    self.jsMethodName = jsMethodName
    super.init(file: file, line: line, function: function)
  }

  override var code: String {
    "ERR_NOT_AVAILABLE_IN_DEV_CLIENT"
  }

  override var reason: String {
    "\(jsMethodName) is not supported in development builds."
  }
}

internal final class NotAllowedAntiBrickingMeasuresException: Exception {
  override var code: String {
    "ERR_UPDATES_CONFIG_OVERRIDE"
  }

  override var reason: String {
    "Must set disableAntiBrickingMeasures configuration to use updates overriding"
  }
}

internal final class InvalidRequestHeadersOverrideException: Exception {
  private let requestHeaders: [String: String]?

  internal init(_ requestHeaders: [String: String]?, file: String = #fileID, line: UInt = #line, function: String = #function) {
    self.requestHeaders = requestHeaders
    super.init(file: file, line: line, function: function)
  }

  override var code: String {
    "ERR_UPDATES_RUNTIME_OVERRIDE"
  }

  override var reason: String {
    """
    Invalid update requestHeaders override: \(String(describing: requestHeaders)). \
    Override keys must be declared in `updates.requestHeaders` in your app config at \
    build time. Add the key to `updates.requestHeaders` and rebuild the app.
    """
  }
}

/**
 * Base class for exceptions that wrap an underlying error and need its description to reach
 * JavaScript.
 *
 * `Promise.reject(code:description:)` and `Exception(name:description:code:)` cannot be used for
 * this: they set `description` but leave `reason` at its default, and the JS-facing message is
 * derived from `reason`, so the description is dropped before it reaches the caller. Overriding
 * `reason` is the supported way to control that message.
 */
internal class UpdatesUnderlyingErrorException: Exception, @unchecked Sendable {
  internal let underlyingError: Error

  internal init(_ underlyingError: Error, file: String = #fileID, line: UInt = #line, function: String = #function) {
    self.underlyingError = underlyingError
    super.init(file: file, line: line, function: function)
  }
}

internal final class CheckForUpdateException: UpdatesUnderlyingErrorException, @unchecked Sendable {
  override var code: String {
    "ERR_UPDATES_CHECK"
  }

  override var reason: String {
    "Failed to check for update: \(underlyingError.localizedDescription)"
  }
}

internal final class FetchUpdateException: UpdatesUnderlyingErrorException, @unchecked Sendable {
  override var code: String {
    "ERR_UPDATES_FETCH"
  }

  override var reason: String {
    "Failed to download new update: \(underlyingError.localizedDescription)"
  }
}

internal final class ReadLogEntriesException: UpdatesUnderlyingErrorException, @unchecked Sendable {
  override var code: String {
    "ERR_UPDATES_READ_LOGS"
  }

  override var reason: String {
    "Failed to read log entries: \(underlyingError.localizedDescription)"
  }
}

internal final class ClearLogEntriesException: UpdatesUnderlyingErrorException, @unchecked Sendable {
  override var code: String {
    "ERR_UPDATES_READ_LOGS"
  }

  override var reason: String {
    "Failed to clear log entries: \(underlyingError.localizedDescription)"
  }
}

// swiftlint:enable line_length

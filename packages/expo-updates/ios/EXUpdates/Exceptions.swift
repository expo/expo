// Copyright 2022-present 650 Industries. All rights reserved.

// swiftlint:disable line_length

import ExpoModulesCore

internal final class UpdatesDisabledException: Exception {
  override var code: String {
    "ERR_UPDATES_DISABLED"
  }

  override var reason: String {
    "Cannot call module method when expo-updates is disabled"
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

internal final class UpdatesReloadException: Exception {
  override var code: String {
    "ERR_UPDATES_RELOAD"
  }

  override var reason: String {
    "Could not reload application. Ensure you have set the `bridge` property of AppController."
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

internal final class UpdatesStateException: Exception {
  convenience init(_ message: String) {
    self.init(name: "UpdatesStateException", description: message, code: "ERR_UPDATES_STATE_EXCEPTION", file: #fileID, line: #line, function: #function)
  }
}

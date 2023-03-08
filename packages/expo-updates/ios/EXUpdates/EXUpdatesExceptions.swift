// Copyright 2022-present 650 Industries. All rights reserved.

// swiftlint:disable line_length

import ExpoModulesCore

internal class UpdatesDisabledException: Exception {
  override var code: String {
    "ERR_UPDATES_DISABLED"
  }

  override var reason: String {
    "Cannot call module method when expo-updates is disabled"
  }
}

internal class UpdatesNotInitializedException: Exception {
  override var code: String {
    "ERR_UPDATES_DISABLED"
  }

  override var reason: String {
    "The updates module controller has not been properly initialized. If you're in development mode, you cannot use this method. Otherwise, make sure you have called EXUpdatesAppController.sharedInstance.start()"
  }
}

internal class UpdatesReloadException: Exception {
  override var code: String {
    "ERR_UPDATES_RELOAD"
  }

  override var reason: String {
    "Could not reload application. Ensure you have set the `bridge` property of EXUpdatesAppController."
  }
}

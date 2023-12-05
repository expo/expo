// Copyright 2022-present 650 Industries. All rights reserved.

// swiftlint:disable line_length

import ExpoModulesCore

public final class UpdatesDisabledException: Exception {
  public override var code: String {
    "ERR_UPDATES_DISABLED"
  }

  public override var reason: String {
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

public final class UpdatesReloadException: Exception {
  public override var code: String {
    "ERR_UPDATES_RELOAD"
  }

  public override var reason: String {
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

internal final class NotAvailableInDevClientException: Exception {
  override var code: String {
    "ERR_NOT_AVAILABLE_IN_DEV_CLIENT"
  }

  override var reason: String {
    "This method is not supported in development client builds. A non-development build should be used to test this functionality."
  }
}

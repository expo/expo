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

// swiftlint:enable line_length

// Copyright 2022-present 650 Industries. All rights reserved.

// swiftlint:disable line_length

import ExpoModulesCore

public final class UpdatesDisabledException: Exception {
  private let actionBeingPerformed: String

  public init(_ actionBeingPerformed: String, file: String = #fileID, line: UInt = #line, function: String = #function) {
    self.actionBeingPerformed = actionBeingPerformed
    super.init(file: file, line: line, function: function)
  }

  public override var code: String {
    "ERR_UPDATES_DISABLED"
  }

  public override var reason: String {
    "Cannot \(actionBeingPerformed) when expo-updates is not enabled."
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
  private let actionBeingPerformed: String

  public init(_ actionBeingPerformed: String, file: String = #fileID, line: UInt = #line, function: String = #function) {
    self.actionBeingPerformed = actionBeingPerformed
    super.init(file: file, line: line, function: function)
  }

  override var code: String {
    "ERR_NOT_AVAILABLE_IN_DEV_CLIENT"
  }

  override var reason: String {
    "Cannot \(actionBeingPerformed) in a development client. A non-development build should be used to test this functionality."
  }
}

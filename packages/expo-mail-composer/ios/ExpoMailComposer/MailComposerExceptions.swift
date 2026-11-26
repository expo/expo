// Copyright 2022-present 650 Industries. All rights reserved.

import MessageUI
import ExpoModulesCore

internal final class CannotSendMailException: Exception {
  override var reason: String {
    "Mail services are not available, make sure you're signed into the Mail app"
  }
}

internal final class OperationInProgressException: Exception {
  override var reason: String {
    "Cannot compose an email because another email composing operation is in progress"
  }
}

internal final class MissingViewControllerException: Exception {
  override var reason: String {
    "Unable to find the current view controller to present the compose view controller"
  }
}

internal final class SendingFailedException: GenericException<Error?> {
  override var reason: String {
    "Something went wrong while trying to send the email: \(param.debugDescription)"
  }
}

internal final class UnknownResultException: GenericException<MFMailComposeResult> {
  override var reason: String {
    "Received unknown result: \(param)"
  }
}

internal final class FileSystemNotFoundException: Exception {
  override var reason: String {
    "FileSystem module not found, make sure 'expo-file-system' is linked correctly"
  }
}

internal final class FileSystemReadPermissionException: GenericException<String> {
  override var reason: String {
    "File '\(param)' is not readable"
  }
}

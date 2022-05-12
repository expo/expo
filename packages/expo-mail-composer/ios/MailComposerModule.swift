// Copyright 2022-present 650 Industries. All rights reserved.

import MessageUI
import MobileCoreServices
import ExpoModulesCore

public class MailComposerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoMailComposer")

    AsyncFunction("isAvailableAsync", canSendMail)

    AsyncFunction("composeAsync") { (options: MailComposeOptions, promise: Promise) in
      guard canSendMail() else {
        throw CannotSendMailException()
      }
      guard let appContext = self.appContext else {
        throw CannotSendMailException()
      }

      let composingSession = MailComposingSession(appContext, promise)
      try composingSession.compose(options: options)
      composingSession.present()
    }
    .runOnQueue(.main)
  }
}

private func canSendMail() -> Bool {
  return MFMailComposeViewController.canSendMail()
}

internal class CannotSendMailException: Exception {
  override var reason: String {
    "Mail services are not available, make sure you're signed into the Mail app"
  }
}

internal class FileSystemNotFoundException: Exception {
  override var reason: String {
    "FileSystem module not found, make sure 'expo-file-system' is linked correctly"
  }
}

internal class FileSystemReadPermissionException: GenericException<String> {
  override var reason: String {
    "File '\(param)' is not readable"
  }
}

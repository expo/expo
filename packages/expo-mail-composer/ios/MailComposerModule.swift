// Copyright 2022-present 650 Industries. All rights reserved.

import MessageUI
import MobileCoreServices
import ExpoModulesCore

public class MailComposerModule: Module {
  var currentSession: MailComposingSession?

  public func definition() -> ModuleDefinition {
    Name("ExpoMailComposer")

    AsyncFunction("isAvailableAsync", canSendMail)

    AsyncFunction("composeAsync") { (options: MailComposerOptions, promise: Promise) in
      guard canSendMail() else {
        throw CannotSendMailException()
      }
      guard self.currentSession == nil else {
        throw OperationInProgressException()
      }
      guard let appContext = self.appContext else {
        throw AppContextLostException()
      }

      let session = MailComposingSession(appContext)
      try session.compose(options: options)

      // This is important to retain the session until it finishes
      self.currentSession = session

      session.presentViewController { result in
        promise.settle(with: result)

        // Release the session so it can get deallocated
        self.currentSession = nil
      }
    }
    .runOnQueue(.main)
  }
}

private func canSendMail() -> Bool {
  return MFMailComposeViewController.canSendMail()
}

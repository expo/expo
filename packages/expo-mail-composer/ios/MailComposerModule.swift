// Copyright 2022-present 650 Industries. All rights reserved.

import MessageUI
import ExpoModulesCore

// TODO: Rename the package to 'ExpoMail'
@ExpoModule("ExpoMailComposer")
public class MailComposerModule: Module {
  @MainActor
  var currentSession: MailComposingSession?

  @JS(.concurrent)
  func isAvailableAsync() async -> Bool {
    return canSendMail()
  }

  @JS
  @MainActor
  func composeAsync(options: MailComposerOptions) async throws -> [String: String] {
    guard canSendMail() else {
      throw CannotSendMailException()
    }
    guard currentSession == nil else {
      throw OperationInProgressException()
    }
    guard let appContext else {
      throw Exceptions.AppContextLost()
    }

    let session = MailComposingSession(appContext)
    try session.compose(options: options)

    // This is important to retain the session until it finishes
    currentSession = session

    return try await withCheckedThrowingContinuation { continuation in
      // The session can report more than one result, but only the first one settles the call.
      var continuation: CheckedContinuation<[String: String], Error>? = continuation

      session.presentViewController { result in
        continuation?.resume(with: result.mapError { $0 as Error })
        continuation = nil

        // Release the session so it can get deallocated
        self.currentSession = nil
      }
    }
  }

  // Function to check the availability of listed mail clients on the device
  @JS
  func getClients() -> [MailClient] {
    return getAvailableMailClients()
  }
}

// Private function to check each mail client for availability
private func getAvailableMailClients() -> [MailClient] {
  var availableClients = [MailClient]()
  for client in mailClients {
    if let url = URL(string: client.url), UIApplication.shared.canOpenURL(url) {
      availableClients.append(client)
    }
  }
  return availableClients
}

private func canSendMail() -> Bool {
  return MFMailComposeViewController.canSendMail()
}

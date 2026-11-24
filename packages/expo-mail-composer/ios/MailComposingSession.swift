// Copyright 2022-present 650 Industries. All rights reserved.

import MessageUI
import UniformTypeIdentifiers
import ExpoModulesCore

@MainActor
internal final class MailComposingSession: NSObject, @preconcurrency MFMailComposeViewControllerDelegate, UIAdaptivePresentationControllerDelegate {
  let appContext: AppContext
  let composeController: MFMailComposeViewController
  private var continuation: CheckedContinuation<[String: String], Error>?

  init(_ appContext: AppContext) {
    self.appContext = appContext
    self.composeController = MFMailComposeViewController()
    super.init()

    self.composeController.mailComposeDelegate = self
  }

  func compose(options: MailComposerOptions) throws {
    composeController.setToRecipients(options.recipients)
    composeController.setCcRecipients(options.ccRecipients)
    composeController.setBccRecipients(options.bccRecipients)
    composeController.setSubject(options.subject)
    composeController.setMessageBody(options.body, isHTML: options.isHtml)

    if let attachments = options.attachments {
      guard let fileSystem = appContext.fileSystem else {
        throw FileSystemNotFoundException()
      }
      for attachment in attachments {
        guard fileSystem.permissions(forURI: attachment).contains(.read) else {
          throw FileSystemReadPermissionException(attachment.path)
        }
        let mimeType = findMimeType(forAttachment: attachment)
        let fileData = try Data(contentsOf: attachment)
        composeController.addAttachmentData(fileData, mimeType: mimeType, fileName: attachment.lastPathComponent)
      }
    }
  }

  func present() async throws -> [String: String] {
    guard let currentViewController = appContext.utilities?.currentViewController() else {
      throw MissingViewControllerException()
    }
    if let presentationController = composeController.presentationController {
      presentationController.delegate = self
    }
    return try await withCheckedThrowingContinuation { continuation in
      self.continuation = continuation
      currentViewController.present(composeController, animated: true)
    }
  }

  // MARK: - MFMailComposeViewControllerDelegate

  func mailComposeController(_ controller: MFMailComposeViewController, didFinishWith result: MFMailComposeResult, error: Error?) {
    composeController.dismiss(animated: true) {
      switch result {
      case .cancelled:
        self.finish(with: .success(["status": "cancelled"]))
      case .saved:
        self.finish(with: .success(["status": "saved"]))
      case .sent:
        self.finish(with: .success(["status": "sent"]))
      case .failed:
        self.finish(with: .failure(SendingFailedException(error)))
      @unknown default:
        self.finish(with: .failure(UnknownResultException(result)))
      }
    }
  }

  // MARK: - UIAdaptivePresentationControllerDelegate
  func presentationControllerDidDismiss(_ presentationController: UIPresentationController) {
    finish(with: .success(["status": "cancelled"]))
  }

  // The session can report more than one result, but only the first one settles the call.
  private func finish(with result: Result<[String: String], Error>) {
    continuation?.resume(with: result)
    continuation = nil
  }
}

private func findMimeType(forAttachment attachment: URL) -> String {
  if let utType = UTType(tag: attachment.pathExtension, tagClass: .filenameExtension, conformingTo: nil),
     let mimeType = utType.preferredMIMEType {
    return mimeType
  }
  return "application/octet-stream"
}

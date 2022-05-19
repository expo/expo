// Copyright 2022-present 650 Industries. All rights reserved.

import MessageUI
import MobileCoreServices
import ExpoModulesCore

internal final class MailComposingSession: NSObject, MFMailComposeViewControllerDelegate {
  typealias ComposingCallback = (Result<[String: String], Exception>) -> ()

  let appContext: AppContext
  let composeController: MFMailComposeViewController
  var callback: ComposingCallback?

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

  func presentViewController(_ callback: @escaping ComposingCallback) {
    guard let currentViewController = appContext.utilities?.currentViewController() else {
      callback(.failure(MissingViewControllerException()))
      return
    }
    self.callback = callback
    currentViewController.present(composeController, animated: true)
  }

  // MARK: - MFMailComposeViewControllerDelegate

  func mailComposeController(_ controller: MFMailComposeViewController, didFinishWith result: MFMailComposeResult, error: Error?) {
    composeController.dismiss(animated: true) {
      guard let callback = self.callback else {
        return
      }
      switch result {
      case .cancelled:
        callback(.success(["status": "cancelled"]))
      case .saved:
        callback(.success(["status": "saved"]))
      case .sent:
        callback(.success(["status": "sent"]))
      case .failed:
        callback(.failure(SendingFailedException(error)))
      @unknown default:
        callback(.failure(UnknownResultException(result)))
      }
    }
  }
}

private func findMimeType(forAttachment attachment: URL) -> String {
  if let identifier = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, attachment.pathExtension as CFString, nil)?.takeRetainedValue(),
     let type = UTTypeCopyPreferredTagWithClass(identifier, kUTTagClassMIMEType)?.takeRetainedValue() {
    return type as String
  }
  return "application/octet-stream"
}

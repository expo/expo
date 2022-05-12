// Copyright 2022-present 650 Industries. All rights reserved.

import MessageUI
import MobileCoreServices
import ExpoModulesCore

internal final class MailComposingSession: NSObject, MFMailComposeViewControllerDelegate {
  let appContext: AppContext
  let promise: Promise
  let composeController: MFMailComposeViewController

  init(_ appContext: AppContext, _ promise: Promise) {
    self.appContext = appContext
    self.promise = promise
    self.composeController = MFMailComposeViewController()
    super.init()

    self.composeController.mailComposeDelegate = self
  }

  func compose(options: MailComposeOptions) throws {
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

  func present() {
    appContext.utilities?.currentViewController()?.present(composeController, animated: true)
  }

  // MARK: - MFMailComposeViewControllerDelegate

  func mailComposeController(_ controller: MFMailComposeViewController, didFinishWith result: MFMailComposeResult, error: Error?) {
    composeController.dismiss(animated: true) { [promise] in
      switch result {
      case .cancelled:
        promise.resolve(["status": "cancelled"])
      case .saved:
        promise.resolve(["status": "saved"])
      case .sent:
        promise.resolve(["status": "sent"])
      case .failed:
        promise.reject("ERR_MAIL_ERROR", "Something went wrong while trying to send the e-mail")
      @unknown default:
        promise.reject("ERR_UNKNOWN_RESULT", "Received unknown result: \(result)")
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

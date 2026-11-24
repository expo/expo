import CoreServices
import ExpoModulesCore
import MessageUI
import MobileCoreServices
import UniformTypeIdentifiers

@ExpoModule("ExpoSMS")
public class ExpoSMSModule: Module {
  @MainActor
  private var currentDelegate: SMSDelegate?

  @JS
  @MainActor
  func isAvailableAsync() async -> Bool {
    return MFMessageComposeViewController.canSendText()
  }

  @JS
  @MainActor
  func sendSMSAsync(addresses: [String], message: String, options: SMSOptions) async throws -> [String: String] {
    if !MFMessageComposeViewController.canSendText() {
      throw SMSUnavailableException()
    }

    if currentDelegate != nil {
      throw SMSPendingException()
    }

    let messageComposeViewController = MFMessageComposeViewController()
    messageComposeViewController.recipients = addresses
    messageComposeViewController.body = message

    for attachment in options.attachments {
      let utiRef = UTTypeCreatePreferredIdentifierForTag(
        kUTTagClassMIMEType,
        attachment.mimeType as CFString,
        nil
      )

      if utiRef == nil {
        throw SMSMimeTypeException(attachment.mimeType)
      }

      guard let url = URL(string: attachment.uri) else {
        throw SMSUriException(attachment.uri)
      }

      let data: Data
      do {
        data = try Data(contentsOf: url, options: .mappedIfSafe)
      } catch {
        throw UnexpectedException(error)
      }
      let attached = messageComposeViewController.addAttachmentData(
        data,
        typeIdentifier: attachment.mimeType,
        filename: attachment.filename
      )
      if !attached {
        throw SMSFileException(attachment.uri)
      }
    }

    guard let presenter = appContext?.utilities?.currentViewController() else {
      throw SMSMissingViewControllerException()
    }

    let smsDelegate = SMSDelegate()
    currentDelegate = smsDelegate
    defer { currentDelegate = nil }
    return try await smsDelegate.present(messageComposeViewController, from: presenter)
  }
}

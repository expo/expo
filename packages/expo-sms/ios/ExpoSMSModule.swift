import CoreServices
import ExpoModulesCore
import MessageUI
import MobileCoreServices
import UniformTypeIdentifiers

struct ExpoSMSContext {
  let continuation: CheckedContinuation<[String: String], Error>
  let smsDelegate: SMSDelegate
}

@ExpoModule("ExpoSMS")
public class ExpoSMSModule: Module, SMSResultHandler {
  @MainActor
  private var smsContext: ExpoSMSContext?

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

    if smsContext != nil {
      throw SMSPendingException()
    }

    let smsDelegate = SMSDelegate(handler: self)

    let messageComposeViewController = MFMessageComposeViewController()
    messageComposeViewController.messageComposeDelegate = smsDelegate
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

    return try await withCheckedThrowingContinuation { continuation in
      smsContext = ExpoSMSContext(continuation: continuation, smsDelegate: smsDelegate)
      appContext?.utilities?.currentViewController()?.present(messageComposeViewController, animated: true, completion: nil)
    }
  }

  @MainActor
  func onSuccess(_ data: [String: String]) {
    guard let continuation = smsContext?.continuation else {
      log.error("SMS context has been lost")
      return
    }
    smsContext = nil
    continuation.resume(returning: data)
  }

  @MainActor
  func onFailure(_ error: String) {
    guard let continuation = smsContext?.continuation else {
      log.error("SMS context has been lost")
      return
    }
    smsContext = nil
    continuation.resume(throwing: SMSSendingException(error))
  }
}

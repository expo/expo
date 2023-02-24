import ExpoModulesCore
import MessageUI
import CoreServices
import MobileCoreServices
import UniformTypeIdentifiers

struct ExpoSMSContext {
  let promise: Promise
  let smsDelegate: SMSDelegate
}

public class ExpoSMSModule: Module, SMSResultHandler {
  private var smsContext: ExpoSMSContext?
  private lazy var utils = appContext?.utilities

  public func definition() -> ModuleDefinition {
    Name("ExpoSMS")

    AsyncFunction("isAvailableAsync") {
      return MFMessageComposeViewController.canSendText()
    }

    AsyncFunction("sendSMSAsync") { (addresses: [String], message: String, options: SMSOptions, promise: Promise) in
      try sendSMSAsync(addresses: addresses, message: message, options: options, promise: promise)
    }.runOnQueue(.main)
  }

  private func sendSMSAsync(addresses: [String], message: String, options: SMSOptions, promise: Promise) throws {
    if !MFMessageComposeViewController.canSendText() {
      throw SMSUnavailableException()
    }

    if smsContext != nil {
      throw SMSPendingException()
    }

    let smsDelegate = SMSDelegate(handler: self)
    let context = ExpoSMSContext(promise: promise, smsDelegate: smsDelegate)

    let messageComposeViewController = MFMessageComposeViewController()
    messageComposeViewController.messageComposeDelegate = context.smsDelegate
    messageComposeViewController.recipients = addresses
    messageComposeViewController.body = message

    for attachment in options.attachments {
      let utiRef = UTTypeCreatePreferredIdentifierForTag(
        kUTTagClassMIMEType, attachment.mimeType as CFString, nil)

      if utiRef == nil {
        throw SMSMimeTypeException(attachment.mimeType)
      }

      guard let url = URL(string: attachment.uri) else {
        throw SMSUriException(attachment.uri)
      }

      do {
        let data = try Data(contentsOf: url, options: .mappedIfSafe)
        let attached = messageComposeViewController.addAttachmentData(
          data,
          typeIdentifier: attachment.mimeType,
          filename: attachment.filename)
        if !attached {
          throw SMSFileException(attachment.uri)
        }
      } catch {
        context.promise.reject(error)
        return
      }
    }

    smsContext = context
    utils?.currentViewController()?.present(messageComposeViewController, animated: true, completion: nil)
  }

  func onSuccess(_ data: [String: String]) {
    guard let promise = smsContext?.promise else {
      log.error("SMS context has been lost")
      return
    }
    smsContext = nil
    promise.resolve(data)
  }

  func onFailure(_ error: String) {
    guard let promise = smsContext?.promise else {
      log.error("SMS context has been lost")
      return
    }
    smsContext = nil
    promise.reject(SMSSendingException(error))
  }
}

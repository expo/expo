import MessageUI

protocol SMSResultHandler {
  @MainActor
  func onSuccess(_ data: [String: String])
  @MainActor
  func onFailure(_ error: String)
}

@MainActor
class SMSDelegate: NSObject, @preconcurrency MFMessageComposeViewControllerDelegate {
  private let handler: SMSResultHandler

  init(handler: SMSResultHandler) {
    self.handler = handler
  }

  func messageComposeViewController(
    _ controller: MFMessageComposeViewController,
    didFinishWith result: MessageComposeResult
  ) {
    controller.dismiss(animated: true) {
      switch result {
      case .sent, .cancelled:
        self.handler.onSuccess([
          "result": result == .sent ? "sent" : "cancelled"
        ])
      case .failed:
        self.handler.onFailure(
          """
          User's attempt to save or send an SMS was unsuccessful.
          This can occur when the device loses connection to WiFi or Cellular
          """
        )
      default:
        self.handler.onFailure("SMS message sending failed with unknown error")
      }
    }
  }
}

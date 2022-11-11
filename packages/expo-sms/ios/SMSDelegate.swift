import MessageUI

protocol SMSResultHandler {
  func onSuccess(_ data: [String: String])
  func onFailure(_ error: String)
}

class SMSDelegate: NSObject, MFMessageComposeViewControllerDelegate {
  private let handler: SMSResultHandler

  init(handler: SMSResultHandler) {
    self.handler = handler
  }

  func messageComposeViewController(
    _ controller: MFMessageComposeViewController,
    didFinishWith result: MessageComposeResult
  ) {
    var resolveData = [String: String]()
    var rejectMessage = ""

    switch result {
    case .cancelled:
      resolveData["result"] = "cancelled"
    case .sent:
      resolveData["result"] = "sent"
    case .failed:
      rejectMessage = """
                User's attempt to save or send an SMS was unsuccessful.
                This can occur when the device loses connection to Wifi or Cellular.
            """
    default:
      rejectMessage = "SMS message sending failed with unknown error"
    }

    controller.dismiss(animated: true) {
      if !rejectMessage.isEmpty {
        self.handler.onFailure(rejectMessage)
      } else {
        self.handler.onSuccess(resolveData)
      }
    }
  }
}

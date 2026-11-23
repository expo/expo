import ExpoModulesCore
import MessageUI

@MainActor
class SMSDelegate: NSObject, @preconcurrency MFMessageComposeViewControllerDelegate {
  private var continuation: CheckedContinuation<[String: String], Error>?

  func present(
    _ controller: MFMessageComposeViewController,
    from presenter: UIViewController
  ) async throws -> [String: String] {
    controller.messageComposeDelegate = self
    return try await withCheckedThrowingContinuation { continuation in
      self.continuation = continuation
      presenter.present(controller, animated: true)
    }
  }

  func messageComposeViewController(
    _ controller: MFMessageComposeViewController,
    didFinishWith result: MessageComposeResult
  ) {
    controller.dismiss(animated: true) {
      switch result {
      case .sent, .cancelled:
        self.finish(with: .success([
          "result": result == .sent ? "sent" : "cancelled"
        ]))
      case .failed:
        self.finish(with: .failure(SMSSendingException(
          """
          User's attempt to save or send an SMS was unsuccessful.
          This can occur when the device loses connection to WiFi or Cellular
          """
        )))
      default:
        self.finish(with: .failure(SMSSendingException("SMS message sending failed with unknown error")))
      }
    }
  }

  private func finish(with result: Result<[String: String], Error>) {
    continuation?.resume(with: result)
    continuation = nil
  }
}

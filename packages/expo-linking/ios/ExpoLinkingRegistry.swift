import Foundation

typealias OnURLReceivedCallback = (URL) -> Void

public let clearInitialURLNotification = Notification.Name("ExpoLinkingClearInitialURL")

class ExpoLinkingRegistry: NSObject {
  static let shared = ExpoLinkingRegistry()
  var initialURL: URL?

  private override init() {
    super.init()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleClearInitialURL),
      name: clearInitialURLNotification,
      object: nil
    )
  }

  @objc
  private func handleClearInitialURL() {
    initialURL = nil
  }
}

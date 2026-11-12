import ExpoModulesCore

public let onURLReceivedNotification = Notification.Name("onURLReceived")

@ExpoModule("ExpoLinking")
public class ExpoLinkingModule: Module {
  @Event("onURLReceived")
  var onURLReceived: (URLReceivedEvent) -> Void

  public override func didStartListening(event: String) {
    guard event == "onURLReceived" else {
      return
    }
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleURLReceivedNotification),
      name: onURLReceivedNotification,
      object: nil
    )
  }

  public override func didStopListening(event: String) {
    guard event == "onURLReceived" else {
      return
    }
    // swiftlint:disable:next notification_center_detachment
    NotificationCenter.default.removeObserver(self)
  }

  @JS
  func getLinkingURL() -> String? {
    return ExpoLinkingRegistry.shared.initialURL?.absoluteString
  }

  @JS
  func clearInitialURL() {
    ExpoLinkingRegistry.shared.initialURL = nil
  }

  @objc func handleURLReceivedNotification(_ notification: Notification) {
    guard let url = notification.userInfo?["url"] as? URL else {
      return
    }
    onURLReceived(URLReceivedEvent(url: url.absoluteString))
  }
}

@Record
struct URLReceivedEvent {
  var url: String
}

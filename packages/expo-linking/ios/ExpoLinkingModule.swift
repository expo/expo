import ExpoModulesCore

let onURLReceived = "onURLReceived"
public let onURLReceivedNotification = Notification.Name(onURLReceived)

public class ExpoLinkingModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoLinking")

    Events(onURLReceived)

    OnStartObserving(onURLReceived) {
      NotificationCenter.default.addObserver(self, selector: #selector(handleURLReceivedNotification), name: onURLReceivedNotification, object: nil)
    }

    OnStopObserving(onURLReceived) {
      // swiftlint:disable:next notification_center_detachment
      NotificationCenter.default.removeObserver(self)
    }

    Function("getLinkingURL") {
      return ExpoLinkingRegistry.shared.initialURL?.absoluteString
    }
  }

  @objc func handleURLReceivedNotification(_ notification: Notification) {
    guard let url = notification.userInfo?["url"] as? URL else {
      return
    }
    self.sendEvent(onURLReceived, ["url": url.absoluteString])
  }
}

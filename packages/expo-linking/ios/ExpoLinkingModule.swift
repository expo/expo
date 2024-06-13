import ExpoModulesCore

let onURLReceivedNotification = Notification.Name("onURLReceived")

public class ExpoLinkingModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoLinking")

    Events("onURLReceived")

    OnStartObserving("onURLReceived") {
      NotificationCenter.default.addObserver(self, selector: #selector(handleURLReceivedNotification), name: onURLReceivedNotification, object: nil)
    }

    OnStopObserving("onURLReceived") {
      NotificationCenter.default.removeObserver(self)
//      ExpoLinkingRegistry.shared.onURLReceived = nil
    }

    Function("getLinkingURL") {
      return ExpoLinkingRegistry.shared.initialURL?.absoluteString
    }

    Function("clearLinkingURL") {
      ExpoLinkingRegistry.shared.initialURL = nil
    }
  }

  @objc func handleURLReceivedNotification(_ notification: Notification) {
    guard let url = notification.userInfo?["url"] as? URL else {
      return
    }
    self.sendEvent("onURLReceived", ["url": url.absoluteString])
  }
}

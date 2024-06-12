import ExpoModulesCore

public class ExpoLinkingModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoLinking")

    Events("onURLReceived")

    OnStartObserving("onURLReceived") {
      ExpoLinkingRegistry.shared.onURLReceived = { url in
        self.sendEvent("onURLReceived", ["url": self.parseExpoLink(url)])
      }
    }

    OnStopObserving {
      ExpoLinkingRegistry.shared.onURLReceived = nil
    }

    Function("getLinkingURL") {
      return parseExpoLink(ExpoLinkingRegistry.shared.initialURL)
    }

    Function("clearLinkingURL") {
      ExpoLinkingRegistry.shared.initialURL = nil
    }
  }

  func parseExpoLink(_ url: URL?) -> String? {
    guard let url = url else {
      return nil
    }
    return url.absoluteString
  }
}

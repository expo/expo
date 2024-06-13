import ExpoModulesCore

public class ExpoLinkingModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoLinking")

    Events("onURLReceived")

    OnStartObserving("onURLReceived") {
      ExpoLinkingRegistry.shared.onURLReceived = { url in
        self.sendEvent("onURLReceived", ["url": url.absoluteString])
      }
    }

    OnStopObserving("onURLReceived") {
      ExpoLinkingRegistry.shared.onURLReceived = nil
    }

    Function("getLinkingURL") {
      return ExpoLinkingRegistry.shared.initialURL?.absoluteString
    }

    Function("clearLinkingURL") {
      ExpoLinkingRegistry.shared.initialURL = nil
    }
  }
}

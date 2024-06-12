import ExpoModulesCore

public class ExpoLinkingModule: Module {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  public func definition() -> ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoLinking')` in JavaScript.
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

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
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

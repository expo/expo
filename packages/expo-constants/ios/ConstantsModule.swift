import ExpoModulesCore
import WebKit

public class ConstantsModule: Module {
  private lazy var constants = appContext?.constants?.constants() as? [String: Any] ?? [:]

  public func definition() -> ModuleDefinition {
    Name("ExponentConstants")

    Constants {
      return constants
    }

    AsyncFunction("getWebViewUserAgentAsync") { () -> String? in
      let webView = WKWebView()
      return webView.value(forKey: "userAgent") as? String
    }.runOnQueue(.main)
  }
}

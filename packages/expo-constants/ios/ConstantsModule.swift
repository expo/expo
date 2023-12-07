import ExpoModulesCore
#if !os(tvOS)
import WebKit
#endif

public class ConstantsModule: Module {
  private lazy var constants = appContext?.constants?.constants() as? [String: Any] ?? [:]

  public func definition() -> ModuleDefinition {
    Name("ExponentConstants")

    Constants {
      return constants
    }

    AsyncFunction("getWebViewUserAgentAsync") { () -> String? in
#if os(tvOS)
      return nil
#else
      let webView = WKWebView()
      return webView.value(forKey: "userAgent") as? String
#endif
    }.runOnQueue(.main)
  }
}

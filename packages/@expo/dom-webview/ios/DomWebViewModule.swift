// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class DomWebViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoDomWebViewModule")

    OnDestroy {
      DomWebViewRegistry.shared.reset()
    }

    AsyncFunction("evalJsForWebViewAsync") { (webViewId: Int, source: String) in
      if let webView = DomWebViewRegistry.shared.get(webViewId: webViewId) {
        webView.injectJavaScript(source)
      }
    }

    // swiftlint:disable closure_body_length
    View(DomWebView.self) {
      Events("onMessage")

      Prop("source") { (view: DomWebView, source: DomWebViewSource) in
        view.setSource(source)
      }

      Prop("injectedJavaScriptBeforeContentLoaded") { (view: DomWebView, script: String) in
        view.setInjectedJSBeforeContentLoaded(script)
      }

      Prop("webviewDebuggingEnabled") { (view: DomWebView, enabled: Bool) in
        view.webviewDebuggingEnabled = enabled
      }

      Prop("scrollEnabled") { (view: DomWebView, enabled: Bool) in
        view.setScrollEnabled(enabled)
      }

      Prop("decelerationRate") { (view: DomWebView, decelerationRate: Either<String, Double>) in
        var newDecelerationRate: UIScrollView.DecelerationRate?
        if let rateString: String = decelerationRate.get() {
          if rateString == "normal" {
            newDecelerationRate = .normal
          } else if rateString == "fast" {
            newDecelerationRate = .fast
          }
        } else if let rate: Double = decelerationRate.get() {
          newDecelerationRate = UIScrollView.DecelerationRate(rawValue: rate)
        }
        if let newDecelerationRate {
          view.decelerationRate = newDecelerationRate
        }
      }

      AsyncFunction("injectJavaScript") { (view: DomWebView, script: String) in
        view.injectJavaScript(script)
      }

      OnViewDidUpdateProps { view in
        view.reload()
      }
    }
    // swiftlint:enable closure_body_length
  }
}

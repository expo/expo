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

      // MARK: - IosScrollViewProps

      Prop("bounces") { (view: DomWebView, enabled: Bool) in
        view.webView.scrollView.bounces = enabled
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

      Prop("scrollEnabled") { (view: DomWebView, enabled: Bool) in
        view.webView.scrollView.isScrollEnabled = enabled
      }

      Prop("pagingEnabled") { (view: DomWebView, enabled: Bool) in
        view.webView.scrollView.isPagingEnabled = enabled
      }

      Prop("automaticallyAdjustsScrollIndicatorInsets") { (view: DomWebView, enabled: Bool) in
        view.webView.scrollView.automaticallyAdjustsScrollIndicatorInsets = enabled
      }

      Prop("contentInset") { (view: DomWebView, inset: ContentInset) in
        view.webView.scrollView.contentInset = inset.toEdgeInsets()
      }

      Prop("contentInsetAdjustmentBehavior") { (view: DomWebView, value: ContentInsetAdjustmentBehavior) in
        view.webView.scrollView.contentInsetAdjustmentBehavior = value.toContentInsetAdjustmentBehavior()
      }

      Prop("directionalLockEnabled") { (view: DomWebView, enabled: Bool) in
        view.webView.scrollView.isDirectionalLockEnabled = enabled
      }

      Prop("showsHorizontalScrollIndicator") { (view: DomWebView, enabled: Bool) in
        view.webView.scrollView.showsHorizontalScrollIndicator = enabled
      }

      Prop("showsVerticalScrollIndicator") { (view: DomWebView, enabled: Bool) in
        view.webView.scrollView.showsVerticalScrollIndicator = enabled
      }

      // MARK: - Imperative methods

      AsyncFunction("scrollTo") { (view: DomWebView, param: ScrollToParam) in
        view.scrollTo(offset: CGPoint(x: param.x, y: param.y), animated: param.animated)
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

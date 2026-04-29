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
      Events("onMessage", "onContentProcessDidTerminate")

      Prop("source") { (view: DomWebView, source: DomWebViewSource) in
        view.setSource(source)
      }

      Prop("injectedJavaScript") { (view: DomWebView, script: String) in
        view.setInjectedJS(script)
      }

      Prop("injectedJavaScriptBeforeContentLoaded") { (view: DomWebView, script: String) in
        view.setInjectedJSBeforeContentLoaded(script)
      }

      Prop("injectedJavaScriptObject") { (view: DomWebView, source: String) in
        view.setInjectedJavaScriptObject(source)
      }

      Prop("webviewDebuggingEnabled") { (view: DomWebView, enabled: Bool) in
        view.webviewDebuggingEnabled = enabled
      }

      // MARK: - WKWebViewConfiguration props (init-only)

      Prop("allowsInlineMediaPlayback") { (view: DomWebView, enabled: Bool) in
        view.allowsInlineMediaPlayback = enabled
      }

      Prop("mediaPlaybackRequiresUserAction") { (view: DomWebView, enabled: Bool) in
        view.mediaPlaybackRequiresUserAction = enabled
      }

      Prop("allowsPictureInPictureMediaPlayback") { (view: DomWebView, enabled: Bool) in
        view.allowsPictureInPictureMediaPlayback = enabled
      }

      Prop("allowsAirPlayForMediaPlayback") { (view: DomWebView, enabled: Bool) in
        view.allowsAirPlayForMediaPlayback = enabled
      }

      // MARK: - IosScrollViewProps

      Prop("bounces") { (view: DomWebView, enabled: Bool) in
        view.bounces = enabled
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
        view.scrollEnabled = enabled
      }

      Prop("pagingEnabled") { (view: DomWebView, enabled: Bool) in
        view.pagingEnabled = enabled
      }

      Prop("automaticallyAdjustContentInsets") { (view: DomWebView, enabled: Bool) in
        view.automaticallyAdjustContentInsets = enabled
      }

      Prop("automaticallyAdjustsScrollIndicatorInsets") { (view: DomWebView, enabled: Bool) in
        view.automaticallyAdjustsScrollIndicatorInsets = enabled
      }

      Prop("contentInset") { (view: DomWebView, inset: ContentInset) in
        view.contentInset = inset.toEdgeInsets()
      }

      Prop("contentInsetAdjustmentBehavior") { (view: DomWebView, value: ContentInsetAdjustmentBehavior) in
        view.contentInsetAdjustmentBehavior = value.toContentInsetAdjustmentBehavior()
      }

      Prop("directionalLockEnabled") { (view: DomWebView, enabled: Bool) in
        view.directionalLockEnabled = enabled
      }

      Prop("showsHorizontalScrollIndicator") { (view: DomWebView, enabled: Bool) in
        view.showsHorizontalScrollIndicator = enabled
      }

      Prop("showsVerticalScrollIndicator") { (view: DomWebView, enabled: Bool) in
        view.showsVerticalScrollIndicator = enabled
      }

      // MARK: - Imperative methods

      AsyncFunction("scrollTo") { (view: DomWebView, param: ScrollToParam) in
        view.scrollTo(offset: CGPoint(x: param.x, y: param.y), animated: param.animated)
      }

      AsyncFunction("injectJavaScript") { (view: DomWebView, script: String) in
        view.injectJavaScript(script)
      }

      AsyncFunction("reload") { (view: DomWebView) in
        view.forceReload()
      }

      OnViewDidUpdateProps { view in
        view.reload()
      }
    }
    // swiftlint:enable closure_body_length
  }
}

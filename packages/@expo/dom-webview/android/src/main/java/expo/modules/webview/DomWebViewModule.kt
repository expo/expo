// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.webview

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

@Suppress("unused")
class DomWebViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoDomWebViewModule")

    OnDestroy {
      DomWebViewRegistry.reset()
    }

    AsyncFunction("evalJsForWebViewAsync") { webViewId: Int, source: String ->
      DomWebViewRegistry.get(webViewId)?.injectJavaScript(source)
    }

    View(DomWebView::class) {
      Events("onMessage")

      Prop("source") { view: DomWebView, source: DomWebViewSource ->
        view.setSource(source)
      }

      Prop("injectedJavaScriptBeforeContentLoaded") { view: DomWebView, script: String ->
        view.setInjectedJSBeforeContentLoaded(script)
      }

      Prop("webviewDebuggingEnabled") { view: DomWebView, enabled: Boolean ->
        view.webviewDebuggingEnabled = enabled
      }

      Prop("showsHorizontalScrollIndicator") { view: DomWebView, enabled: Boolean ->
        view.webView.post {
          view.webView.isHorizontalScrollBarEnabled = enabled
        }
      }

      Prop("showsVerticalScrollIndicator") { view: DomWebView, enabled: Boolean ->
        view.webView.post {
          view.webView.isVerticalScrollBarEnabled = enabled
        }
      }

      Prop("nestedScrollEnabled") { view: DomWebView, enabled: Boolean ->
        view.nestedScrollEnabled = enabled
      }

      AsyncFunction("scrollTo") { view: DomWebView, param: ScrollToParam ->
        view.scrollTo(param)
      }

      AsyncFunction("injectJavaScript") { view: DomWebView, script: String ->
        view.injectJavaScript(script)
      }

      OnViewDidUpdateProps { view: DomWebView ->
        view.reload()
      }
    }
  }
}

// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.webview

import android.webkit.JavascriptInterface

internal class DomWebViewBridge(private val webView: DomWebView) {
  @JavascriptInterface
  fun eval(params: String): String {
    return webView.evalSync(params)
  }
}

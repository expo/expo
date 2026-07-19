// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.webview

import android.webkit.JavascriptInterface

internal class RNCWebViewBridge(private val webView: DomWebView) {
  var injectedObjectJson: String = "{}"

  @JavascriptInterface
  fun postMessage(message: String) {
    webView.dispatchMessageEvent(message)
  }

  @JavascriptInterface
  fun injectedObjectJson(): String {
    return injectedObjectJson
  }
}

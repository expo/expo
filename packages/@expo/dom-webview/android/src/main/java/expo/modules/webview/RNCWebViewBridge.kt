// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.webview

import android.webkit.JavascriptInterface

internal class RNCWebViewBridge(private val webView: DomWebView) {
  @JavascriptInterface
  fun postMessage(message: String) {
    webView.dispatchMessageEvent(message)
  }
}

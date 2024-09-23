// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.webview

import androidx.collection.ArrayMap
import java.lang.ref.WeakReference

internal typealias WebViewId = Int

internal object DomWebViewRegistry {
  private val registry = ArrayMap<WebViewId, WeakDomWebViewRef>()
  private var nextWebViewId: WebViewId = 0

  @Synchronized
  fun get(webViewId: WebViewId): DomWebView? {
    return registry[webViewId]?.ref?.get()
  }

  @Synchronized
  fun add(webView: DomWebView): WebViewId {
    val webViewId = this.nextWebViewId
    this.registry[webViewId] = WeakDomWebViewRef(WeakReference(webView))
    this.nextWebViewId += 1
    return webViewId
  }

  @Synchronized
  fun remove(webViewId: WebViewId): DomWebView? {
    return this.registry.remove(webViewId)?.ref?.get()
  }

  @Synchronized
  fun reset() {
    this.registry.clear()
    this.nextWebViewId = 0
  }
}

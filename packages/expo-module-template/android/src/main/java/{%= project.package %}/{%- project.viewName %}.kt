package <%- project.package %>

import android.content.Context
import android.webkit.WebView
import android.webkit.WebViewClient
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class <%- project.viewName %>(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  // Creates and initializes an event dispatcher for the `onLoad` event.
  // The name of the event is inferred from the value and needs to match the event name defined in the module.
  private val onLoad by EventDispatcher()

  // Defines a WebView that will be used as the root subview.
  internal val webView = WebView(context).apply {
    layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
    webViewClient = object : WebViewClient() {
      override fun onPageFinished(view: WebView, url: String) {
        // Sends an event to JavaScript. Triggers a callback defined on the view component in JavaScript.
        onLoad(mapOf("url" to url))
      }
    }
  }

  init {
    // Adds the WebView to the view hierarchy.
    addView(webView)
  }
}

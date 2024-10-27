package com.reactnativecommunity.webview

import com.facebook.react.bridge.JavaScriptModule
import com.facebook.react.bridge.WritableMap

internal interface RNCWebViewMessagingModule : JavaScriptModule {
  fun onShouldStartLoadWithRequest(event: WritableMap)
  fun onMessage(event: WritableMap)
}

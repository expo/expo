// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.webview

import java.lang.ref.WeakReference

internal data class WeakDomWebViewRef(
  val ref: WeakReference<DomWebView>
)

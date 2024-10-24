// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.devlauncher.launcher

import android.net.Uri
import com.facebook.react.packagerconnection.ReconnectingWebSocket
import expo.modules.kotlin.devtools.ExpoRequestCdpInterceptor
import java.io.Closeable

internal class DevLauncherNetworkInterceptor(appUrl: Uri) : Closeable, ExpoRequestCdpInterceptor.Delegate {
  private val metroConnection = ReconnectingWebSocket(
    createNetworkInspectorUrl(appUrl),
    null,
    null
  )
    .apply {
      connect()
    }

  init {
    ExpoRequestCdpInterceptor.setDelegate(this)
  }

  //region Closeable implementations
  override fun close() {
    ExpoRequestCdpInterceptor.setDelegate(null)
    metroConnection.closeQuietly()
  }
  //endregion Closeable implementations

  //region ExpoRequestCdpInterceptor.Delegate implementations
  override fun dispatch(event: String) {
    metroConnection.sendMessage(event)
  }
  //endregion ExpoRequestCdpInterceptor.Delegate implementations
}

private fun createNetworkInspectorUrl(appUrl: Uri): String {
  val host = appUrl.host ?: "localhost"
  val port = if (appUrl.port > 0) appUrl.port else 8081
  val scheme = if (appUrl.scheme == "https") "wss" else "ws"
  return "$scheme://$host:$port/inspector/network"
}

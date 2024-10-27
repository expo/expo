// Copyright 2015-present 650 Industries. All rights reserved.

package versioned.host.exp.exponent

import com.facebook.react.ReactHost
import com.facebook.react.bridge.Inspector
import com.facebook.react.devsupport.DevServerHelper
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.InspectorPackagerConnection
import expo.modules.kotlin.devtools.ExpoRequestCdpInterceptor
import expo.modules.manifests.core.Manifest
import java.io.Closeable

@Suppress("unused")
class ExpoNetworkInterceptor : Closeable, ExpoRequestCdpInterceptor.Delegate {
  private var isStarted = false
  private val inspectorPackagerConnection = InspectorPackagerConnectionWrapper()
  private var reactHost: ReactHost? = null

  fun start(manifest: Manifest, reactHost: ReactHost) {
    val buildProps = (manifest.getPluginProperties("expo-build-properties")?.get("android") as? Map<*, *>)
      ?.mapKeys { it.key.toString() }
    val enableNetworkInspector = buildProps?.get("networkInspector") as? Boolean ?: true
    isStarted = enableNetworkInspector

    this.onResume(reactHost)
  }

  fun onResume(reactHost: ReactHost) {
    if (!isStarted || reactHost.devSupportManager?.devSupportEnabled == true) {
      return
    }
    this.reactHost = reactHost
    ExpoRequestCdpInterceptor.setDelegate(this)
  }

  fun onPause() {
    if (!isStarted) {
      return
    }
    ExpoRequestCdpInterceptor.setDelegate(null)
    this.reactHost = null
  }

  override fun close() {
    this.onPause()
  }

  override fun dispatch(event: String) {
    reactHost?.let {
      inspectorPackagerConnection.sendWrappedEventToAllPages(it, event)
    }
  }
}

/**
 * A `InspectorPackagerConnection` wrapper to expose private members with reflection
 */
internal class InspectorPackagerConnectionWrapper {
  private val devServerHelperField = DevSupportManagerBase::class.java.getDeclaredField("mDevServerHelper")
  private val inspectorPackagerConnectionField = DevServerHelper::class.java.getDeclaredField("mInspectorPackagerConnection")
  private val sendWrappedEventMethod = InspectorPackagerConnection::class.java.getDeclaredMethod("sendWrappedEvent", String::class.java, String::class.java)

  init {
    devServerHelperField.isAccessible = true
    inspectorPackagerConnectionField.isAccessible = true
    sendWrappedEventMethod.isAccessible = true
  }

  fun sendWrappedEventToAllPages(reactHost: ReactHost, event: String) {
    val devServerHelper = devServerHelperField[reactHost.devSupportManager]
    val inspectorPackagerConnection = inspectorPackagerConnectionField[devServerHelper] as? InspectorPackagerConnection ?: return
    for (page in Inspector.getPages()) {
      if (!page.title.contains("Reanimated")) {
        sendWrappedEventMethod.invoke(inspectorPackagerConnection, page.id.toString(), event)
      }
    }
  }
}

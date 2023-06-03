// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.devlauncher.launcher

import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.Inspector
import com.facebook.react.common.LifecycleState
import com.facebook.react.devsupport.DevServerHelper
import com.facebook.react.devsupport.InspectorPackagerConnection
import expo.modules.devlauncher.DevLauncherController
import expo.modules.kotlin.devtools.ExpoRequestCdpInterceptor
import java.io.Closeable
import java.lang.ref.WeakReference
import java.lang.reflect.Field
import java.lang.reflect.Method

internal class DevLauncherNetworkInterceptor(controller: DevLauncherController) : Closeable, ExpoRequestCdpInterceptor.Delegate {
  private val weakController = WeakReference(controller)
  private var reactInstanceHashCode: Int = 0
  private var _inspectorPackagerConnection: InspectorPackagerConnectionWrapper? = null

  private val inspectorPackagerConnection: InspectorPackagerConnectionWrapper
    get() {
      val reactInstanceManager = requireNotNull(weakController.get()?.appHost?.reactInstanceManager)
      if (reactInstanceHashCode != reactInstanceManager.hashCode()) {
        _inspectorPackagerConnection?.clear()
        _inspectorPackagerConnection = null
        reactInstanceHashCode = 0
      }
      if (_inspectorPackagerConnection == null) {
        _inspectorPackagerConnection = InspectorPackagerConnectionWrapper(reactInstanceManager)
        reactInstanceHashCode = reactInstanceManager.hashCode()
      }
      return requireNotNull(_inspectorPackagerConnection)
    }

  init {
    ExpoRequestCdpInterceptor.setDelegate(this)
  }

  /**
   * Returns true when it is allowed to send CDP events
   */
  private fun shouldEmitEvents(): Boolean {
    return DevLauncherController.wasInitialized() && weakController.get()?.appHost?.reactInstanceManager?.lifecycleState == LifecycleState.RESUMED
  }

  //region Closeable implementations
  override fun close() {
    ExpoRequestCdpInterceptor.setDelegate(null)
  }
  //endregion Closeable implementations

  //region ExpoRequestCdpInterceptor.Delegate implementations
  override fun dispatch(event: String) {
    if (shouldEmitEvents()) {
      inspectorPackagerConnection.sendWrappedEventToAllPages(event)
    }
  }
  //endregion ExpoRequestCdpInterceptor.Delegate implementations
}

/**
 * A `InspectorPackagerConnection` wrapper to expose private members with reflection
 */
internal class InspectorPackagerConnectionWrapper constructor(reactInstanceManager: ReactInstanceManager) {
  private var inspectorPackagerConnectionWeak: WeakReference<InspectorPackagerConnection> = WeakReference(null)
  private val devServerHelperWeak: WeakReference<DevServerHelper>
  private val inspectorPackagerConnectionField: Field
  private val sendWrappedEventMethod: Method

  private val inspectorPackagerConnection: InspectorPackagerConnection?
    get() {
      var inspectorPackagerConnection = inspectorPackagerConnectionWeak.get()
      if (inspectorPackagerConnection == null) {
        val devServerHelper = devServerHelperWeak.get() ?: return null
        inspectorPackagerConnection = inspectorPackagerConnectionField[devServerHelper] as? InspectorPackagerConnection

        if (inspectorPackagerConnection != null) {
          inspectorPackagerConnectionWeak = WeakReference(inspectorPackagerConnection)
        }
      }
      return inspectorPackagerConnection
    }

  init {
    val devSupportManager = reactInstanceManager.devSupportManager
    val devSupportManagerBaseClass: Class<*> = devSupportManager.javaClass.superclass
    val mDevServerHelperField = devSupportManagerBaseClass.getDeclaredField("mDevServerHelper")
    mDevServerHelperField.isAccessible = true
    val devServerHelper = mDevServerHelperField[devSupportManager]
    devServerHelperWeak = WeakReference(devServerHelper as DevServerHelper)

    inspectorPackagerConnectionField = DevServerHelper::class.java.getDeclaredField("mInspectorPackagerConnection")
    inspectorPackagerConnectionField.isAccessible = true

    sendWrappedEventMethod = InspectorPackagerConnection::class.java.getDeclaredMethod("sendWrappedEvent", String::class.java, String::class.java)
    sendWrappedEventMethod.isAccessible = true
  }

  fun clear() {
    inspectorPackagerConnectionWeak.clear()
  }

  fun sendWrappedEventToAllPages(event: String) {
    val inspectorPackagerConnection = this.inspectorPackagerConnection ?: return
    for (page in Inspector.getPages()) {
      if (!page.title.contains("Reanimated")) {
        sendWrappedEventMethod.invoke(inspectorPackagerConnection, page.id.toString(), event)
      }
    }
  }
}

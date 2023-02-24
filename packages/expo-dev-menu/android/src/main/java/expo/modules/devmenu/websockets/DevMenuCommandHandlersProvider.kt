package expo.modules.devmenu.websockets

import android.util.Log
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.packagerconnection.NotificationOnlyHandler
import expo.interfaces.devmenu.DevMenuManagerInterface
import expo.modules.devmenu.devtools.DevMenuDevToolsDelegate
import org.json.JSONObject
import java.lang.ref.WeakReference

class DevMenuCommandHandlersProvider(
  private val manager: DevMenuManagerInterface,
  reactInstanceManager: ReactInstanceManager
) {
  private val _instanceManager = WeakReference(reactInstanceManager)
  private val instanceManager
    get() = _instanceManager.get()

  private val onReload = object : NotificationOnlyHandler() {
    override fun onNotification(params: Any?) {
      manager.closeMenu()
      UiThreadUtil.runOnUiThread {
        instanceManager?.devSupportManager?.handleReloadJS()
      }
    }
  }

  private val onDevMenu = object : NotificationOnlyHandler() {
    override fun onNotification(params: Any?) {
      val activity = instanceManager?.currentReactContext?.currentActivity ?: return
      manager.toggleMenu(activity)
    }
  }

  private val onDevCommand = object : NotificationOnlyHandler() {
    override fun onNotification(params: Any?) {
      val instanceManager = instanceManager ?: return
      val devDelegate = DevMenuDevToolsDelegate(manager, instanceManager)

      if (params is JSONObject) {
        val command = params.optString("name") ?: return

        when (command) {
          "reload" -> devDelegate.reload()
          "toggleDevMenu" -> {
            val activity = instanceManager.currentReactContext?.currentActivity ?: return
            manager.toggleMenu(activity)
          }
          "toggleRemoteDebugging" -> devDelegate.toggleRemoteDebugging()
          "toggleElementInspector" -> devDelegate.toggleElementInspector()
          "togglePerformanceMonitor" -> {
            val activity = instanceManager.currentReactContext?.currentActivity ?: return
            devDelegate.togglePerformanceMonitor(activity)
          }
          "openJSInspector" -> devDelegate.openJSInspector()
          else -> Log.w("DevMenu", "Unknown command: $command")
        }
      }
    }
  }

  fun createCommandHandlers(): Map<String, NotificationOnlyHandler> {
    return mapOf(
      "reload" to onReload,
      "devMenu" to onDevMenu,
      "sendDevCommand" to onDevCommand
    )
  }
}

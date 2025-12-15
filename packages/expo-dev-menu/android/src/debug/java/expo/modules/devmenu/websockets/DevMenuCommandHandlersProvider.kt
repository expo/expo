package expo.modules.devmenu.websockets

import android.util.Log
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.packagerconnection.NotificationOnlyHandler
import expo.modules.devmenu.devtools.DevMenuDevToolsDelegate
import org.json.JSONObject
import java.lang.ref.WeakReference

class DevMenuCommandHandlersProvider(
  weakDevSupportManager: WeakReference<out DevSupportManager>
) {
  private val devToolsDelegate = DevMenuDevToolsDelegate(weakDevSupportManager)

  private val onReload = createHandler { devToolsDelegate.reload() }
  private val onDevMenu = createHandler { devToolsDelegate.toggleMenu() }
  private val onDevCommand = createHandler { params ->
    if (params is JSONObject) {
      val command = params.optString("name") ?: return@createHandler

      with(devToolsDelegate) {
        when (command) {
          "reload" -> reload()
          "toggleDevMenu" -> toggleMenu()
          "toggleElementInspector" -> toggleElementInspector()
          "togglePerformanceMonitor" -> togglePerformanceMonitor()
          "openJSInspector" -> openJSInspector()
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

  private fun createHandler(action: (params: Any?) -> Unit): NotificationOnlyHandler {
    return object : NotificationOnlyHandler() {
      override fun onNotification(params: Any?) {
        action(params)
      }
    }
  }
}

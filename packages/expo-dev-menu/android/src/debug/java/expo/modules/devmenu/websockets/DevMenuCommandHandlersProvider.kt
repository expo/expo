package expo.modules.devmenu.websockets

import android.util.Log
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.packagerconnection.NotificationOnlyHandler
import expo.modules.devmenu.devtools.DevMenuDevToolsDelegate
import org.json.JSONObject
import java.lang.ref.WeakReference
import java.util.Date

private object Mutex
private var lastMessage = 0L

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
    lastMessage = Date().time

    return mapOf(
      "reload" to onReload,
      "devMenu" to onDevMenu,
      "sendDevCommand" to onDevCommand
    )
  }

  private fun createHandler(action: (params: Any?) -> Unit): NotificationOnlyHandler {
    return object : NotificationOnlyHandler() {
      override fun onNotification(params: Any?) {
        val currentTime = Date().time

        synchronized(Mutex) {
          val diff = currentTime - lastMessage
          if (diff < 100) {
            Log.w(
              "DevMenu",
              "Throttling incoming dev menu command. Time since last command: ${diff}ms"
            )
            return
          }

          action(params)
          lastMessage = currentTime
        }
      }
    }
  }
}

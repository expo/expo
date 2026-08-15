package expo.modules.devlauncher.launcher

import android.content.Intent
import kotlin.properties.Delegates

typealias DevLauncherPendingIntentListener = (Intent) -> Unit

class DevLauncherIntentRegistry {
  private val pendingIntentListeners = mutableListOf<DevLauncherPendingIntentListener>()
  var intent by Delegates.observable<Intent?>(null) { _, _, newValue ->
    newValue?.let { intent ->
      pendingIntentListeners.forEach {
        it.invoke(intent)
      }
    }
  }

  fun subscribe(listener: DevLauncherPendingIntentListener) {
    pendingIntentListeners.add(listener)
  }

  fun unsubscribe(listener: DevLauncherPendingIntentListener) {
    pendingIntentListeners.remove(listener)
  }

  fun consumePendingIntent(): Intent? {
    val pendingIntent = intent
    intent = null
    return pendingIntent
  }
}

package expo.modules.developmentclient.launcher

import android.content.Intent
import kotlin.properties.Delegates

typealias DevelopmentClientPendingIntentListener = (Intent) -> Unit

class DevelopmentClientIntentRegistry {
  private val pendingIntentListeners = mutableListOf<DevelopmentClientPendingIntentListener>()
  var intent by Delegates.observable<Intent?>(null) { _, _, newValue ->
    newValue?.let { intent ->
      pendingIntentListeners.forEach {
        it.invoke(intent)
      }
    }
  }

  fun subscribe(listener: DevelopmentClientPendingIntentListener) {
    pendingIntentListeners.add(listener)
  }

  fun unsubscribe(listener: DevelopmentClientPendingIntentListener) {
    pendingIntentListeners.remove(listener)
  }

  fun consumePendingIntent(): Intent? {
    val pendingIntent = intent
    intent = null
    return pendingIntent
  }
}

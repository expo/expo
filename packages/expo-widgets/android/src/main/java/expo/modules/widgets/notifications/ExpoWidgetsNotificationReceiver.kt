package expo.modules.widgets.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import expo.modules.widgets.NOTIFICATION_INTERACTION_ACTION
import expo.modules.widgets.WIDGET_INTERACTION_NOTIFICATION_ID_EXTRA
import expo.modules.widgets.WIDGET_INTERACTION_SOURCE_EXTRA
import expo.modules.widgets.WIDGET_INTERACTION_TARGET_EXTRA
import expo.modules.widgets.WidgetsEvents
import expo.modules.widgets.WidgetsStorage
import expo.modules.widgets.evaluateWidgetButtonPress
import expo.modules.widgets.getWidgetEnvironment
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineName
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

class ExpoWidgetsNotificationReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != NOTIFICATION_INTERACTION_ACTION) {
      return
    }
    val name = intent.getStringExtra(WIDGET_INTERACTION_SOURCE_EXTRA) ?: return
    val target = intent.getStringExtra(WIDGET_INTERACTION_TARGET_EXTRA) ?: return
    val notificationId = intent.getStringExtra(WIDGET_INTERACTION_NOTIFICATION_ID_EXTRA) ?: return

    val pendingResult = goAsync()
    scope.launch {
      try {
        rerenderAfterPress(context.applicationContext, name, notificationId, target)
        WidgetsEvents.sendUserInteraction(name, target, notificationId)
      } finally {
        pendingResult.finish()
      }
    }
  }

  private suspend fun rerenderAfterPress(context: Context, name: String, notificationId: String, target: String) {
    runCatching {
      CustomNotifications.shared.update(context, name, notificationId) { active ->
        val layout = WidgetsStorage.getString(context, "__expo_widgets_notification_${name}_layout")
          ?.takeIf { it.isNotEmpty() } ?: return@update null
        val environment = getWidgetEnvironment(context) + ("target" to target)
        val updatedProps = evaluateWidgetButtonPress(context, layout, active.props, environment) ?: return@update null
        active.copy(props = active.props.orEmpty() + updatedProps)
      }
    }.onFailure { error ->
      if (error is CancellationException) {
        throw error
      }
      if (error !is CustomNotificationCancelledException) {
        Log.e(TAG, "Custom notification '$notificationId' of '$name' could not be re-posted after a button press.", error)
      }
    }
  }

  private companion object {
    const val TAG = "ExpoWidgets"
    val scope = CoroutineScope(
      Dispatchers.Default + SupervisorJob() + CoroutineName("expo.widgets.NotificationReceiverScope")
    )
  }
}

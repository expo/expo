package expo.modules.notifications.service.delegates

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.util.Log
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.notifications.notifications.NotificationManager
import expo.modules.notifications.notifications.debug.DebugLogging
import expo.modules.notifications.service.NotificationsService.Companion.GOOGLE_MESSAGE_ID_KEY
import expo.modules.notifications.service.NotificationsService.Companion.NOTIFICATION_RESPONSE_KEY
import expo.modules.notifications.service.NotificationsService.Companion.TEXT_INPUT_NOTIFICATION_RESPONSE_KEY

class ExpoNotificationLifecycleListener : ReactActivityLifecycleListener {

  /**
   * This will be triggered if the app is not running,
   * and is started from clicking on a notification.
   *
   * Notification data will be in activity.intent.extras
   */
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    val intent = activity.intent ?: return
    val extras = intent.extras ?: return
    // only actions that have opensAppToForeground: true are handled here
    if (extras.containsKey(NOTIFICATION_RESPONSE_KEY) || extras.containsKey(TEXT_INPUT_NOTIFICATION_RESPONSE_KEY)) {
      Log.d("ReactNativeJS", "[native] ExpoNotificationLifecycleListener contains an unmarshalled notification response. Skipping.")
      return
    }
    if (!isFCMIntent(extras)) {
      return
    }
    if (isConsumed(extras)) {
      return
    }
    DebugLogging.logBundle("ExpoNotificationLifeCycleListener.onCreate:", extras)
    markConsumed(intent, extras)
    NotificationManager.onNotificationResponseFromExtras(extras)
  }

  /**
   * This will be triggered if the app is running and in the background,
   * and the user clicks on a notification to open the app.
   *
   * Notification data will be in intent.extras
   */
  override fun onNewIntent(intent: Intent): Boolean {
    val extras = intent.extras
    if (extras != null) {
      if (extras.containsKey(NOTIFICATION_RESPONSE_KEY) || extras.containsKey(TEXT_INPUT_NOTIFICATION_RESPONSE_KEY)) {
        intent.removeExtra(NOTIFICATION_RESPONSE_KEY)
        intent.removeExtra(TEXT_INPUT_NOTIFICATION_RESPONSE_KEY)
        // response events are already handled by
        // NotificationForwarderActivity -> NotificationsService.onReceiveNotificationResponse -> NotificationEmitter.onNotificationResponseReceived
        return false
      }
      if (!isFCMIntent(extras)) {
        return false
      }
      DebugLogging.logBundle("ExpoNotificationLifeCycleListener.onNewIntent:", extras)
      markConsumed(intent, extras)
      NotificationManager.onNotificationResponseFromExtras(extras)
    }
    return false
  }

  /**
   * Returns true if the extras represent a genuine FCM notification intent.
   * FCM always includes [GOOGLE_MESSAGE_ID_KEY] in notification data.
   * OEM extras (e.g. Samsung's "anim_not_finish") do not contain this key.
   */
  private fun isFCMIntent(extras: Bundle): Boolean {
    return extras.containsKey(GOOGLE_MESSAGE_ID_KEY)
  }

  private fun isConsumed(extras: Bundle): Boolean {
    val messageId = extras.getString(GOOGLE_MESSAGE_ID_KEY) ?: return false
    return extras.getString(CONSUMED_MESSAGE_ID_KEY) == messageId
  }

  private fun markConsumed(intent: Intent, extras: Bundle) {
    intent.putExtra(CONSUMED_MESSAGE_ID_KEY, extras.getString(GOOGLE_MESSAGE_ID_KEY))
  }

  companion object {
    private const val CONSUMED_MESSAGE_ID_KEY = "expo.modules.notifications.consumedMessageId"
  }
}

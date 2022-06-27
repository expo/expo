package expo.modules.notifications.service

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import expo.modules.notifications.BuildConfig
import expo.modules.notifications.service.delegates.ExpoHandlingDelegate

/**
 * An internal Activity that passes given Intent extras from
 * [NotificationsService.createNotificationResponseIntent]
 * and send broadcasts to [NotificationsService].
 */
class NotificationForwarderActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val broadcastIntent =
      NotificationsService.createNotificationResponseBroadcastIntent(applicationContext, intent.extras)
    val notificationResponse = NotificationsService.getNotificationResponseFromBroadcastIntent(broadcastIntent)
    ExpoHandlingDelegate.openAppToForeground(this, notificationResponse)
    sendBroadcast(broadcastIntent)
    finish()
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    // This Activity is expected to launch with new task, supposedly
    // there's no way for `onNewIntent` to be called.
    if (BuildConfig.DEBUG) {
      throw AssertionError()
    }
  }
}

package expo.modules.notifications.service

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.util.Log
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
    try {
      val broadcastIntent =
        NotificationsService.createNotificationResponseBroadcastIntent(applicationContext, intent)
      val notificationResponse = NotificationsService.getNotificationResponseFromBroadcastIntent(intent)
      ExpoHandlingDelegate.openAppToForeground(this, notificationResponse)
      sendBroadcast(broadcastIntent)
    } catch (e: IllegalArgumentException) {
      Log.e("expo-notifications", "Failed to handle notification response: could not recover notification data from intent extras. This may happen on some Android versions. Opening app to foreground.", e)
      // Open the app anyway so the user isn't stuck
      packageManager.getLaunchIntentForPackage(packageName)?.let {
        startActivity(it)
      }
    }
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

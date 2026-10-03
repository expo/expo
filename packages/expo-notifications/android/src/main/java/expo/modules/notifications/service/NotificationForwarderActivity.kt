package expo.modules.notifications.service

import android.app.Activity
import android.content.Intent
import android.os.BadParcelableException
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
    // A PendingIntent created by an older version of this library still carries the notification
    // as a Parcelable, and the loader this Bundle arrives with cannot resolve
    // expo.modules.notifications.… classes. Point it at ours before anything reads the extras -
    // the Bundle is unparcelled lazily, so doing it here is early enough to save that first read.
    intent?.setExtrasClassLoader(NotificationsService::class.java.classLoader)
    try {
      val broadcastIntent =
        NotificationsService.createNotificationResponseBroadcastIntent(applicationContext, intent)
      val notificationResponse = NotificationsService.getNotificationResponseFromBroadcastIntent(intent)
      ExpoHandlingDelegate.openAppToForeground(this, notificationResponse)
      sendBroadcast(broadcastIntent)
    } catch (e: IllegalArgumentException) {
      // The extras were readable but held no recoverable notification data.
      openAppWithoutResponse(e)
    } catch (e: BadParcelableException) {
      // The Bundle failed to unparcel at all. This is not an IllegalArgumentException, so it used
      // to take the app down. See https://github.com/expo/expo/issues/49252
      openAppWithoutResponse(e)
    }
    finish()
  }

  private fun openAppWithoutResponse(e: Exception) {
    Log.e("expo-notifications", "Failed to handle notification response: could not recover notification data from intent extras. This may happen on some Android versions. Opening app to foreground.", e)
    // Open the app anyway so the user isn't stuck.
    ExpoHandlingDelegate.getMainActivityLauncher(this)?.let {
      startActivity(it)
    }
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

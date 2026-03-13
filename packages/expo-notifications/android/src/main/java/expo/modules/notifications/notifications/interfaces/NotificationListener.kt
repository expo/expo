package expo.modules.notifications.notifications.interfaces

import android.os.Bundle
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationResponse

/**
 * Interface used to register in [NotificationManager][expo.modules.notifications.notifications.NotificationManager]
 * and be notified of new message events.
 */
interface NotificationListener {
  /** Callback called when new notification is received while the app is in foreground. */
  fun onNotificationReceived(notification: Notification) {}

  /**
   * Callback called when new notification response is received.
   * @return Whether the notification response has been handled
   */
  fun onNotificationResponseReceived(response: NotificationResponse): Boolean = false

  /** Callback called when notification response is received through package lifecycle listeners. */
  fun onNotificationResponseIntentReceived(extras: Bundle) {}

  /** Callback called when some notifications are dropped. */
  fun onNotificationsDropped() {}
}

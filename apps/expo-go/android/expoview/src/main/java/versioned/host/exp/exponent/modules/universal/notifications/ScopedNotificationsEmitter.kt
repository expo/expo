package versioned.host.exp.exponent.modules.universal.notifications

import android.content.Context
import expo.modules.notifications.notifications.emitting.NotificationsEmitter
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationResponse
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.notifications.ScopedNotificationsUtils

class ScopedNotificationsEmitter(context: Context, private val experienceKey: ExperienceKey) :
  NotificationsEmitter() {
  private val scopedNotificationsUtils: ScopedNotificationsUtils = ScopedNotificationsUtils(context)

  override fun onNotificationReceived(notification: Notification) {
    if (scopedNotificationsUtils.shouldHandleNotification(notification, experienceKey)) {
      super.onNotificationReceived(notification)
    }
  }

  override fun onNotificationResponseReceived(response: NotificationResponse): Boolean {
    return if (scopedNotificationsUtils.shouldHandleNotification(response.notification, experienceKey)) {
      super.onNotificationResponseReceived(response)
    } else {
      false
    }
  }
}

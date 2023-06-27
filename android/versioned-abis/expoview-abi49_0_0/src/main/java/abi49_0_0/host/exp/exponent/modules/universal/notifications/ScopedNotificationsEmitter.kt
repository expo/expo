package abi49_0_0.host.exp.exponent.modules.universal.notifications

import android.content.Context
import host.exp.exponent.kernel.ExperienceKey
import abi49_0_0.expo.modules.notifications.notifications.emitting.NotificationsEmitter
import host.exp.exponent.notifications.ScopedNotificationsUtils
import expo.modules.notifications.notifications.model.*

class ScopedNotificationsEmitter(context: Context, private val experienceKey: ExperienceKey) :
  NotificationsEmitter(context) {
  private val scopedNotificationsUtils: ScopedNotificationsUtils = ScopedNotificationsUtils(context)

  override fun onNotificationReceived(notification: Notification) {
    if (scopedNotificationsUtils.shouldHandleNotification(notification, experienceKey)) {
      super.onNotificationReceived(notification)
    }
  }

  override fun onNotificationResponseReceived(response: NotificationResponse): Boolean {
    return if (scopedNotificationsUtils.shouldHandleNotification(response.notification, experienceKey)) {
      super.onNotificationResponseReceived(response)
    } else false
  }
}

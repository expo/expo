package expo.modules.notifications.service.interfaces

import expo.modules.notifications.notifications.model.NotificationRequest

interface SchedulingDelegate {
  fun setupScheduledNotifications()
  fun getAllScheduledNotifications(): Collection<NotificationRequest>
  fun getScheduledNotification(identifier: String): NotificationRequest?
  fun scheduleNotification(request: NotificationRequest)
  fun triggerNotification(identifier: String)
  fun removeScheduledNotifications(identifiers: Collection<String>)
  fun removeAllScheduledNotifications()
}

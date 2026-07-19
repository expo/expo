package expo.modules.notifications.service.interfaces

import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationResponse

interface HandlingDelegate {
  fun handleNotification(notification: Notification)
  fun handleNotificationResponse(notificationResponse: NotificationResponse)
  fun handleNotificationsDropped()
}

package expo.modules.notifications.service.interfaces

import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationBehavior

interface PresentationDelegate {
  fun presentNotification(notification: Notification, behavior: NotificationBehavior?)
  fun getAllPresentedNotifications(): Collection<Notification>
  fun dismissNotifications(identifiers: Collection<String>)
  fun dismissAllNotifications()
}

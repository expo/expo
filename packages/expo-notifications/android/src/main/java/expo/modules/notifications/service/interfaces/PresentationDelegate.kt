package expo.modules.notifications.service.interfaces

import expo.modules.notifications.notifications.model.NotificationBehaviorRecord
import expo.modules.notifications.notifications.model.Notification

interface PresentationDelegate {
  fun presentNotification(notification: Notification, behavior: NotificationBehaviorRecord?)
  fun getAllPresentedNotifications(): Collection<Notification>
  fun dismissNotifications(identifiers: Collection<String>)
  fun dismissAllNotifications()
}

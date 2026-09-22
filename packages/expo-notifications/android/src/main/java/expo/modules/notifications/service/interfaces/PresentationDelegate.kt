package expo.modules.notifications.service.interfaces

import expo.modules.notifications.notifications.model.NotificationBehaviorRecord
import expo.modules.notifications.notifications.model.Notification

interface PresentationDelegate {
  fun presentNotification(notification: Notification, behavior: NotificationBehaviorRecord?)
  fun getAllPresentedNotifications(): Collection<Notification>
  fun dismissNotifications(identifiers: Collection<String>)
  fun dismissAllNotifications()

  /** Cancels the group summary of [dismissed] once no other member of its group is showing. */
  fun removeOrphanedGroupSummaries(dismissed: Notification) {}
}

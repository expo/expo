/*
 * This class allows you to intercept and mutate incoming remote notifications.
 * didReceive() has ~30 seconds to modify the payload and call the contentHandler,
 * otherwise the system will display the notification’s original content.
 *
 * The notification payload must contain:
 *    "mutable-content" : 1
 *    "alert" : { ... }
 * to trigger this handler.
 */

import UserNotifications

class NotificationService: UNNotificationServiceExtension {
  override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    if let bestAttemptContent = request.content.mutableCopy() as? UNMutableNotificationContent {
      // Modify notification content here...
      if !request.content.categoryIdentifier.isEmpty, let experienceId = request.content.userInfo["experienceId"] as? String {
        bestAttemptContent.categoryIdentifier = EXScopedNotificationsUtils.scopedIdentifier(
          fromId: request.content.categoryIdentifier,
          forExperience: experienceId
        )
      }
      contentHandler(bestAttemptContent)
    }
  }
}

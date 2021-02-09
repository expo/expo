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
      if (!request.content.categoryIdentifier.isEmpty && (request.content.userInfo["experienceId"]) != nil) {
        bestAttemptContent.categoryIdentifier = EXScopedNotificationsUtils.scopedCategoryIdentifier(withId: request.content.categoryIdentifier, forExperience: request.content.userInfo["experienceId"] as! String)
      }
      contentHandler(bestAttemptContent)
    }
  }
  
}

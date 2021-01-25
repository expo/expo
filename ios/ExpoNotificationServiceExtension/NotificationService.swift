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
  
  var contentHandler: ((UNNotificationContent) -> Void)?
  var bestAttemptContent: UNMutableNotificationContent?
  
  override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
    self.contentHandler = contentHandler
    bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
    
    if let bestAttemptContent = bestAttemptContent {
      // Modify notification content here...
      if (!request.content.categoryIdentifier.isEmpty && (request.content.userInfo["experienceId"]) != nil) {
        bestAttemptContent.categoryIdentifier = "\(request.content.userInfo["experienceId"] as! String)/\(request.content.categoryIdentifier)"
      }
      contentHandler(bestAttemptContent)
    }
  }
  
}

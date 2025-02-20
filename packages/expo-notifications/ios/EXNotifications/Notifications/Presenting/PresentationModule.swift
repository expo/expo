//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

public class PresentationModule: Module, NotificationDelegate {
  var presentedNotifications: Set<String> = []

  public func definition() -> ModuleDefinition {
    Name("ExpoNotificationPresenter")

    OnCreate {
      NotificationCenterManager.shared.addDelegate(self)
    }

    OnDestroy {
      NotificationCenterManager.shared.removeDelegate(self)
    }

    AsyncFunction("presentNotificationAsync") { (identifier: String, notificationSpec: [String: Any], promise: Promise) in
      do {
        guard let appContext = appContext else {
          let error = NSError(domain: "ExpoNotificationPresenter", code: 0, userInfo: nil)
          promise.reject("ERR_NOTIF_PRESENT", error.localizedDescription)
          return
        }
        let requestContentRecord = try NotificationRequestContentRecord(from: notificationSpec, appContext: appContext)
        let content = requestContentRecord.toUNMutableNotificationContent()
        var request: UNNotificationRequest?
        try EXUtilities.catchException {
          request = UNNotificationRequest(identifier: identifier, content: content, trigger: nil)
        }
        guard let request = request else {
          promise.reject("ERR_NOTIF_PRESENT", "Notification could not be presented")
          return
        }
        presentedNotifications.insert(identifier)
        UNUserNotificationCenter.current().add(request) { error in
          if let error {
            promise.reject("ERR_NOTIF_PRESENT", error.localizedDescription)
          } else {
            promise.resolve()
          }
        }
      } catch {
        promise.reject("ERR_NOTIF_PRESENT", error.localizedDescription)
      }
    }
    .runOnQueue(.main)

    AsyncFunction("getPresentedNotificationsAsync") { (promise: Promise) in
      UNUserNotificationCenter.current().getDeliveredNotifications { notifications in
        promise.resolve(self.serializeNotifications(notifications))
      }
    }

    AsyncFunction("dismissNotificationAsync") { (identifier: String) in
      UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: [identifier])
    }

    AsyncFunction("dismissAllNotificationsAsync") {
      UNUserNotificationCenter.current().removeAllDeliveredNotifications()
    }
  }

  public func willPresent(_ notification: UNNotification, completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) -> Bool {
    let identifier = notification.request.identifier
    if presentedNotifications.contains(identifier) {
      presentedNotifications.remove(identifier)
      completionHandler([.badge, .sound, .banner]) // .alert is deprecated
      return true
    }
    return false
  }

  func serializeNotifications(_ notifications: [UNNotification]) -> [[AnyHashable: Any]] {
    return notifications.map { notification in
      return EXNotificationSerializer.serializedNotification(notification)
    }
  }
}

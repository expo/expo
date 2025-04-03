//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

open class PresentationModule: Module, NotificationDelegate {
  var presentedNotifications: Set<String> = []

  public func definition() -> ModuleDefinition {
    Name("ExpoNotificationPresenter")

    OnCreate {
      NotificationCenterManager.shared.addDelegate(self)
    }

    OnDestroy {
      NotificationCenterManager.shared.removeDelegate(self)
    }

  AsyncFunction("presentNotificationAsync") { (identifier: String, notificationSpec: [String: Any]) in
      try await presentNotificationAsync(identifier: identifier, notificationSpec: notificationSpec)
    }
      presentNotificationAsync(identifier: identifier, notificationSpec: notificationSpec, promise: promise)
    }

    AsyncFunction("getPresentedNotificationsAsync") { (promise: Promise) in
      UNUserNotificationCenter.current().getDeliveredNotifications { notifications in
        promise.resolve(self.serializeNotifications(notifications))
      }
    }

    AsyncFunction("dismissNotificationAsync") { (identifier: String) in
      removeDeliveredNotifications(identifier: identifier)
    }

    AsyncFunction("dismissAllNotificationsAsync") {
      removeAllDeliveredNotifications()
    }
  }

  open func willPresent(_ notification: UNNotification, completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) -> Bool {
    let identifier = notification.request.identifier
    if presentedNotifications.contains(identifier) {
      presentedNotifications.remove(identifier)
      completionHandler([.badge, .sound, .banner]) // .alert is deprecated
      return true
    }
    return false
  }

  open func serializeNotifications(_ notifications: [UNNotification]) -> [[String: Any]] {
    return notifications.map { notification in
      // TODO: convert serialization to Records
      return EXNotificationSerializer.serializedNotification(notification)
    }
  }

  open func removeDeliveredNotifications(identifier: String) {
    UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: [identifier])
  }

  open func removeAllDeliveredNotifications() {
    UNUserNotificationCenter.current().removeAllDeliveredNotifications()
  }

  open func presentNotificationAsync(identifier: String, notificationSpec: [String: Any]) async throws {
    guard let appContext else {
      let error = NSError(domain: "ExpoNotificationPresenter", code: 0, userInfo: nil)
      throw Exception(name: "ERR_NOTIF_PRESENT", description: error.localizedDescription)
    }
    let requestContentRecord = try NotificationRequestContentRecord(from: notificationSpec, appContext: appContext)
    let content = requestContentRecord.toUNMutableNotificationContent()
    var request: UNNotificationRequest?
    try EXUtilities.catchException {
      request = UNNotificationRequest(identifier: identifier, content: content, trigger: nil)
    }
    guard let request else {
      throw Exception(name: "ERR_NOTIF_PRESENT", description: "Notification could not be presented")
    }
    presentedNotifications.insert(identifier)
    do {
      try await UNUserNotificationCenter.current().add(request)
    } catch {
      throw Exception(name: "ERR_NOTIF_PRESENT", description: error.localizedDescription)
    }
  }
}

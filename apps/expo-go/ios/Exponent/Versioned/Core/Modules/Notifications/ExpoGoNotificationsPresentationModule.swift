// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import EXNotifications

public final class ExpoGoNotificationsPresentationModule: PresentationModule {
  private let scopeKey: String
  // swiftlint:disable:next unavailable_function
  required init(appContext: AppContext) {
    fatalError("Initializer not implemented, use init(appContext:scopeKey:) instead")
  }

  required init(appContext: AppContext, scopeKey: String) {
    self.scopeKey = scopeKey

    super.init(appContext: appContext)
  }

  public override func serializeNotifications(_ notifications: [UNNotification]) -> [[String: Any]] {
    return notifications
      .filter { notification in
        EXScopedNotificationsUtils.shouldNotification(notification, beHandledByExperience: self.scopeKey)
      }
      .map { notification in
        return EXScopedNotificationSerializer.serializedNotification(notification)
      }
  }

  public override func willPresent(_ notification: UNNotification, completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) -> Bool {
    if EXScopedNotificationsUtils.shouldNotification(notification, beHandledByExperience: scopeKey) {
      return super.willPresent(notification, completionHandler: completionHandler)
    }
    completionHandler([])
    return true
  }

  public override func removeDeliveredNotifications(identifier: String) {
    let scopedIdentifier = EXScopedNotificationsUtils.scopedIdentifier(fromId: identifier, forExperience: scopeKey)
    UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: [scopedIdentifier])
  }

  public override func removeAllDeliveredNotifications() {
    UNUserNotificationCenter.current().getDeliveredNotifications { notifications in
      var identifiers: Set<String> = []
      notifications.forEach {
        if EXScopedNotificationsUtils.shouldNotification($0, beHandledByExperience: self.scopeKey) {
          identifiers.insert($0.request.identifier)
        }
      }
      UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: Array(identifiers))
    }
  }

  public override func presentNotificationAsync(identifier: String, notificationSpec: [String: Any], promise: Promise) {
    let scopedIdentifier = EXScopedNotificationsUtils.scopedIdentifier(fromId: identifier, forExperience: scopeKey)
    super.presentNotificationAsync(identifier: identifier, notificationSpec: notificationSpec, promise: promise)
  }
}

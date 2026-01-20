// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import ExpoNotifications

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

  public override func serializeNotifications(_ notifications: [UNNotification]) -> [NotificationRecord] {
    return notifications
      .filter { notification in
        EXScopedNotificationsUtils.shouldNotification(notification, beHandledByExperience: self.scopeKey)
      }
      .map { notification in
        return EXScopedNotificationSerializer.serializedNotification(notification)
      }
  }

  public override func removeDeliveredNotifications(identifier: String) {
    let scopedIdentifier = EXScopedNotificationsUtils.scopedIdentifier(fromId: identifier, forExperience: scopeKey)
    UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: [scopedIdentifier])
  }

  public override func removeAllDeliveredNotifications() async {
    let notifications = await UNUserNotificationCenter.current().deliveredNotifications()
    let identifiers = notifications
      .filter { EXScopedNotificationsUtils.shouldNotification($0, beHandledByExperience: self.scopeKey) }
      .compactMap(\.request.identifier)
    UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: Array(identifiers))
  }

}

//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

open class PresentationModule: Module {

  public func definition() -> ModuleDefinition {
    Name("ExpoNotificationPresenter")

    AsyncFunction("getPresentedNotificationsAsync") {
      let notifications = await UNUserNotificationCenter.current().deliveredNotifications()
      return self.serializeNotifications(notifications)
    }

    AsyncFunction("dismissNotificationAsync") { (identifier: String) in
      removeDeliveredNotifications(identifier: identifier)
    }

    AsyncFunction("dismissAllNotificationsAsync") {
      await removeAllDeliveredNotifications()
    }
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

  open func removeAllDeliveredNotifications() async {
    UNUserNotificationCenter.current().removeAllDeliveredNotifications()
  }
}

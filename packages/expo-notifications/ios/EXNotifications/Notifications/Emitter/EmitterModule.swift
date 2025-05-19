//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import MachO
import UIKit

let onDidReceiveNotification = "onDidReceiveNotification"
let onDidReceiveNotificationResponse = "onDidReceiveNotificationResponse"
let onDidClearNotificationResponse = "onDidClearNotificationResponse"

open class EmitterModule: Module, NotificationDelegate {
  private var lastResponse: [String: Any]?
  public func definition() -> ModuleDefinition {
    Name("ExpoNotificationsEmitter")

    Events([
      onDidReceiveNotification, onDidReceiveNotificationResponse, onDidClearNotificationResponse,
    ])

    OnCreate {
      NotificationCenterManager.shared.addDelegate(self)
    }

    OnDestroy {
      NotificationCenterManager.shared.removeDelegate(self)
    }

    Function("getLastNotificationResponse") { () -> [String: Any]? in
      return lastResponse
    }

    Function("clearLastNotificationResponse") {
      lastResponse = nil
    }
  }

  public func didReceive(
    _ userInfo: [AnyHashable: Any], completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) -> Bool {
    completionHandler(.noData)
    return true
  }

  open func didReceive(_ response: UNNotificationResponse, completionHandler: @escaping () -> Void)
    -> Bool
  {
    lastResponse = serializedResponse(response)
    self.sendEvent(onDidReceiveNotificationResponse, serializedResponse(response))
    completionHandler()
    return true
  }

  open func willPresent(
    _ notification: UNNotification,
    completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) -> Bool {
    self.sendEvent(onDidReceiveNotification, serializedNotification(notification))
    return false
  }

  open func serializedNotification(_ notification: UNNotification) -> [String: Any] {
    // TODO: convert serialization to Records
    return EXNotificationSerializer.serializedNotification(notification)
  }

  open func serializedResponse(_ response: UNNotificationResponse) -> [String: Any] {
    // TODO: convert serialization to Records
    return EXNotificationSerializer.serializedNotificationResponse(response)
  }
}

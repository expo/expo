//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

let onDidReceiveNotification = "onDidReceiveNotification"
let onDidReceiveNotificationResponse = "onDidReceiveNotificationResponse"
let onDidClearNotificationResponse = "onDidClearNotificationResponse"

public class EmitterModule: Module, NotificationDelegate {

  public func definition() -> ModuleDefinition {
    Name("ExpoNotificationsEmitter")

    Events([onDidReceiveNotification, onDidReceiveNotificationResponse, onDidClearNotificationResponse])

    OnStartObserving {
      NotificationCenterManager.shared.addDelegate(self)
    }

    OnStopObserving {
      NotificationCenterManager.shared.removeDelegate(self)
    }
  }

  public func didReceiveNotification(_ notification: UNNotification, completionHandler: @escaping (UIBackgroundFetchResult) -> Void) -> Bool {
    completionHandler(.noData)
    return true
  }

  public func didReceiveResponse(_ response: UNNotificationResponse, completionHandler: @escaping () -> Void) -> Bool {
    NotificationCenterManager.shared.lastResponse = response
    // TODO: convert serialization to Records
    let serializedResponse = EXNotificationSerializer.serializedNotificationResponse(response)
    self.sendEvent(onDidReceiveNotificationResponse, serializedResponse as [String: Any])
    return true
  }

  public func willPresent(_ notification: UNNotification, completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) -> Bool {
    // TODO: convert serialization to Records
    let serializedNotification = EXNotificationSerializer.serializedNotification(notification)
    self.sendEvent(onDidReceiveNotification, serializedNotification as [String: Any])
    completionHandler([])
    return true
  }
}

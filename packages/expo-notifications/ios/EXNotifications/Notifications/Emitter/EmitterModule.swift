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

    AsyncFunction("getLastNotificationResponseAsync") {(promise: Promise) in
      if let lastResponse: UNNotificationResponse = NotificationCenterManager.shared.lastResponse {
        promise.resolve(EXNotificationSerializer.serializedNotificationResponse(lastResponse))
      }
      promise.resolve(nil)
    }

    AsyncFunction("clearLastNotificationResponseAsync") {(promise: Promise) in
      NotificationCenterManager.shared.lastResponse = nil
      promise.resolve(nil)
    }
  }

  public func didReceive(_ notification: UNNotification, completionHandler: @escaping (UIBackgroundFetchResult) -> Void) -> Bool {
    completionHandler(.noData)
    return true
  }

  public func didReceive(_ response: UNNotificationResponse, completionHandler: @escaping () -> Void) -> Bool {
    NotificationCenterManager.shared.lastResponse = response
    // TODO: convert serialization to Records
    let serializedResponse = EXNotificationSerializer.serializedNotificationResponse(response)
    self.sendEvent(onDidReceiveNotificationResponse, serializedResponse as [String: Any])
    completionHandler()
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

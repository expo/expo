//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

let onHandleNotification = "onHandleNotification"
let onHandleNotificationTimeout = "onHandleNotificationTimeout"

public class HandlerModule: Module, NotificationDelegate, SingleNotificationHandlerTaskDelegate {
  var tasksMap: [String: SingleNotificationHandlerTask] = [:]

  public func definition() -> ModuleDefinition {
    Name("ExpoNotificationsHandlerModule")

    Events([onHandleNotification, onHandleNotificationTimeout])

    OnStartObserving {
      NotificationCenterManager.shared.addDelegate(self)
    }

    OnStopObserving {
      NotificationCenterManager.shared.removeDelegate(self)
    }

    AsyncFunction("handleNotificationAsync") { (identifier: String, behavior: [String: Bool], promise: Promise) in
      guard let task = tasksMap[identifier] else {
        promise.reject("ERR_NOTIFICATION_HANDLED", "Failed to handle notification \(identifier) because it has already been handled")
        return
      }
      if task.processNotificationWithBehavior(behavior) {
        promise.resolve(nil)
      } else {
        promise.reject("ERR_NOTIFICATION_RESPONSE_TIMEOUT", "Notification has already been handled. Most probably the request has timed out.")
      }
    }
  }

  // MARK: - NotificationDelegate

  public func willPresent(_ notification: UNNotification, completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) -> Bool {
    let task = SingleNotificationHandlerTask(notification: notification, completionHandler: completionHandler, delegate: self)
    tasksMap[task.identifier] = task
    task.start()
    return true
  }

  // MARK: - SingleNotificationHandlerTaskDelegate

  public func taskDidFinish(_ task: SingleNotificationHandlerTask) {
    tasksMap[task.identifier] = nil
  }

  public func handleNotification(_ notification: UNNotification) {
    sendEvent(onHandleNotification, [
      "id": notification.request.identifier,
      "notification": EXNotificationSerializer.serializedNotification(notification)
    ])
  }

  public func handleNotificationTimeout(_ notification: UNNotification) {
    sendEvent(onHandleNotificationTimeout, [
      "id": notification.request.identifier,
      "notification": EXNotificationSerializer.serializedNotification(notification)
    ])
  }
}

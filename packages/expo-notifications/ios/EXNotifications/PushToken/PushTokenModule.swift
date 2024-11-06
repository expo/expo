//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

let onDevicePushTokenEventName = "onDevicePushToken"

public class PushTokenModule: Module {
  var promiseNotYetResolved: Promise?

  @objc
  public func onExpoNotificationsRegistrationResult(notification: Notification) {
    guard let userInfo = notification.userInfo else {
      return
    }
    if let error = userInfo["error"] as? (any Error) {
      promiseNotYetResolved?.reject(error)
      promiseNotYetResolved = nil
    } else if let deviceToken = userInfo["deviceToken"] as? String {
      promiseNotYetResolved?.resolve(deviceToken)
      promiseNotYetResolved = nil
      self.sendEvent(onDevicePushTokenEventName, ["devicePushToken": deviceToken])
    }
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoPushTokenManager")

    Events([onDevicePushTokenEventName])

    OnStartObserving {
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(onExpoNotificationsRegistrationResult),
        name: PushTokenAppDelegateSubscriber.ExpoNotificationsRegistrationResult,
        object: nil
      )
    }

    OnStopObserving {
      // swiftlint:disable:next notification_center_detachment
      NotificationCenter.default.removeObserver(self)
    }

    AsyncFunction("getDevicePushTokenAsync") { (promise: Promise) in
      Task { @MainActor in
        if promiseNotYetResolved != nil {
          promise.reject("E_AWAIT_PROMISE", "Another async call to this method is in progress. Await the first Promise.")
        }
        promiseNotYetResolved = promise
        UIApplication.shared.registerForRemoteNotifications()
      }
    }

    AsyncFunction("unregisterForNotificationsAsync") { () in
      Task { @MainActor in
        UIApplication.shared.unregisterForRemoteNotifications()
      }
    }
  }
}

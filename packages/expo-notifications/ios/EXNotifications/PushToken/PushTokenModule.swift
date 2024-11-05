//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

let onDevicePushTokenEventName = "onDevicePushToken"

public class PushTokenModule: Module {
  var promiseNotYetResolved: Promise?

  public func onNotificationFailure(error: any Error) {
    if let promiseNotYetResolved = promiseNotYetResolved {
      promiseNotYetResolved.reject(error)
    }
  }

  @objc
  public func onNotificationResult(notification: Notification) {
    guard let promise = promiseNotYetResolved,
      let userInfo = notification.userInfo else {
      return
    }
    if let error = userInfo["error"] as? (any Error) {
      promise.reject(error)
      promiseNotYetResolved = nil
      return
    }
    if let deviceToken = userInfo["deviceToken"] as? String {
      promise.resolve(deviceToken)
      self.sendEvent(onDevicePushTokenEventName, ["devicePushToken": deviceToken])
      promiseNotYetResolved = nil
    }
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoPushTokenManager")

    Events([onDevicePushTokenEventName])

    OnStartObserving {
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(onNotificationResult),
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
        if let promiseNotYetResolved = promiseNotYetResolved {
          promise.reject("E_AWAIT_PROMISE", "Another async call to this method is in progress. Await the first Promise.")
        }
        promiseNotYetResolved = promise
        UIApplication.shared.registerForRemoteNotifications()
      }
    }

    AsyncFunction("unregisterForNotificationsAsync") { () in
      UIApplication.shared.unregisterForRemoteNotifications()
    }
  }
}

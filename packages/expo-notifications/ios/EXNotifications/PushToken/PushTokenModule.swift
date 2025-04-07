//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

let onDevicePushTokenEventName = "onDevicePushToken"

public class PushTokenModule: Module, NotificationDelegate {
  var promiseNotYetResolved: Promise?

  public func definition() -> ModuleDefinition {
    Name("ExpoPushTokenManager")

    Events([onDevicePushTokenEventName])

    OnStartObserving(onDevicePushTokenEventName) {
      NotificationCenterManager.shared.addDelegate(self)
    }

    OnStopObserving(onDevicePushTokenEventName) {
      NotificationCenterManager.shared.removeDelegate(self)
    }

    AsyncFunction("getDevicePushTokenAsync") { (promise: Promise) in
      if promiseNotYetResolved != nil {
        promise.reject("E_AWAIT_PROMISE", "Another async call to getDevicePushTokenAsync() is in progress. Await the first Promise.")
        return
      }
      promiseNotYetResolved = promise
      UIApplication.shared.registerForRemoteNotifications()
    }
    .runOnQueue(.main)

    AsyncFunction("unregisterForNotificationsAsync") { () in
      UIApplication.shared.unregisterForRemoteNotifications()
    }
    .runOnQueue(.main)
  }

  public func didRegister(_ deviceToken: String) {
    promiseNotYetResolved?.resolve(deviceToken)
    promiseNotYetResolved = nil
    self.sendEvent(onDevicePushTokenEventName, ["devicePushToken": deviceToken])
  }

  public func didFailRegistration(_ error: any Error) {
    promiseNotYetResolved?.reject(error)
    promiseNotYetResolved = nil
  }
}

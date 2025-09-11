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

    OnCreate {
      NotificationCenterManager.shared.addDelegate(self)
    }

    OnDestroy {
      NotificationCenterManager.shared.removeDelegate(self)
    }

    AsyncFunction("getDevicePushTokenAsync") { (promise: Promise) in
      if let existingPromise = promiseNotYetResolved {
        let message = """
A newer async call to getDevicePushTokenAsync() was started.
To obtain the push token, await the result of the newer call.
"""
        existingPromise.reject("E_PROMISE_REPLACED", message)
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

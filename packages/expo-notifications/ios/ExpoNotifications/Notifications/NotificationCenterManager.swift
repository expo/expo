//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation
import UserNotifications

/**
 Protocol that NotificationCenterManager delegates may implement
 */
public protocol NotificationDelegate: AnyObject {
  func willPresent(_ notification: UNNotification, completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) -> Bool
  func didReceive(_ response: UNNotificationResponse, completionHandler: @escaping () -> Void) -> Bool
  func didReceive(_ userInfo: [AnyHashable: Any], completionHandler: @escaping (UIBackgroundFetchResult) -> Void) -> Bool
  func openSettings(_ notification: UNNotification?)
  func didRegister(_ deviceToken: String)
  func didFailRegistration(_ error: Error)
}

public extension NotificationDelegate {
  func willPresent(_ notification: UNNotification, completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) -> Bool {
    return false
  }
  func didReceive(_ response: UNNotificationResponse, completionHandler: @escaping () -> Void) -> Bool {
    return false
  }
  func didReceive(_ userInfo: [AnyHashable: Any], completionHandler: @escaping (UIBackgroundFetchResult) -> Void) -> Bool {
    // false is equivalent to not handled, we then call completionHandler(.noData) below
    return false
  }
  func openSettings(_ notification: UNNotification?) {}
  func didRegister(_ deviceToken: String) {}
  func didFailRegistration(_ error: Error) {}
}

/**
 Singleton that sets itself as the UserNotificationCenter delegate,
 and calls its own delegates in response to notification center calls.
 */
public class NotificationCenterManager: NSObject,
  UNUserNotificationCenterDelegate,
  NotificationDelegate {
  @objc
  public static let shared = NotificationCenterManager()

  // Delegates are added and removed on whichever thread registers a module or adds a JS
  // listener, while the UNUserNotificationCenter callbacks read them on another thread.
  // Arrays are value types with copy-on-write storage, so unsynchronized access here tears
  // the buffer apart. Every read and write goes through `stateLock`, and the getters hand
  // back a copy: callers iterate a snapshot instead of holding the lock across a delegate
  // call, which is free to call back into `addDelegate` or `removeDelegate`.
  private let stateLock = NSLock()
  private var _delegates: [NotificationDelegate] = []
  private var _pendingResponses: [UNNotificationResponse] = []

  var delegates: [NotificationDelegate] {
    stateLock.lock()
    defer { stateLock.unlock() }
    return _delegates
  }

  var pendingResponses: [UNNotificationResponse] {
    stateLock.lock()
    defer { stateLock.unlock() }
    return _pendingResponses
  }

  let userNotificationCenter: UNUserNotificationCenter = UNUserNotificationCenter.current()

  private override init() {
    super.init()
    if UNUserNotificationCenter.current().delegate != nil {
      NSLog(
        "[expo-notifications] NotificationCenterManager encountered an already present delegate of " +
        "UNUserNotificationCenter. NotificationCenterManager will not overwrite the value not to break other " +
        "features of your app. In return, expo-notifications may not work properly. To fix this problem either " +
        "remove setting of the second delegate, or set the delegate to an instance of NotificationCenterManager " +
        "manually afterwards."
      )
      return
    }
    UNUserNotificationCenter.current().delegate = self
  }

  public func addDelegate(_ delegate: NotificationDelegate) {
    stateLock.lock()
    _delegates.append(delegate)
    stateLock.unlock()

    var handled = false
    for pendingResponse in pendingResponses {
      handled = delegate.didReceive(pendingResponse, completionHandler: {}) || handled
    }
    if handled {
      stateLock.lock()
      _pendingResponses.removeAll()
      stateLock.unlock()
    }
  }

  public func removeDelegate(_ delegate: AnyObject) {
    stateLock.lock()
    defer { stateLock.unlock() }
    if let index = _delegates.firstIndex(where: { $0 === delegate }) {
      _delegates.remove(at: index)
    }
  }

  // MARK: - Called by PushTokenAppDelegateSubscriber

  public func didFailRegistration(_ error: any Error) {
    for delegate in delegates {
      delegate.didFailRegistration(error)
    }
  }

  public func didRegister(_ deviceToken: String) {
    for delegate in delegates {
      delegate.didRegister(deviceToken)
    }
  }

  // MARK: - UNUserNotificationCenterDelegate

  public func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    var handled = false
    for delegate in delegates {
      handled = delegate.willPresent(notification, completionHandler: completionHandler) || handled
    }
    if !handled {
      completionHandler([])
    }
  }

  public func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    var handled = false
    for delegate in delegates {
      handled = delegate.didReceive(response, completionHandler: completionHandler) || handled
    }
    if !handled {
      stateLock.lock()
      _pendingResponses.append(response)
      stateLock.unlock()
    }
    completionHandler()
  }

  public func userNotificationCenter(_ center: UNUserNotificationCenter, openSettingsFor notification: UNNotification?) {
    for delegate in delegates {
      delegate.openSettings(notification)
    }
  }

  // MARK: - Called from NotificationsAppDelegateSubscriber
  public func didReceive(_ userInfo: [AnyHashable: Any], completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    var handled = false
    for delegate in delegates {
      handled = delegate.didReceive(userInfo, completionHandler: completionHandler) || handled
    }
    if !handled {
      completionHandler(.noData)
    }
  }
}

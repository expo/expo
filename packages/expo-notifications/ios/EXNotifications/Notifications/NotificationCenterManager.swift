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

  var delegates: [NotificationDelegate] = []
  var pendingResponses: [UNNotificationResponse] = []
  let userNotificationCenter: UNUserNotificationCenter = UNUserNotificationCenter.current()

  private override init() {
    super.init()
    if UNUserNotificationCenter.current().delegate != nil {
      NSLog(
        "[expo-notifications] NotificationCenterManager encountered already present delegate of " +
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
    delegates.append(delegate)
    var handled = false
    for pendingResponse in pendingResponses {
      handled = delegate.didReceive(pendingResponse, completionHandler: {}) || handled
    }
    if handled {
      pendingResponses.removeAll()
    }
  }

  public func removeDelegate(_ delegate: AnyObject) {
    if let index = delegates.firstIndex(where: { $0 === delegate }) {
      delegates.remove(at: index)
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
      pendingResponses.append(response)
    }
    completionHandler()
  }

  public func userNotificationCenter(_ center: UNUserNotificationCenter, openSettingsFor notification: UNNotification?) {
    for delegate in delegates {
      delegate.openSettings(notification)
    }
  }

  // MARK: - Called from NotificationsAppDelegateSubscriber
  public func didReceiveNotification(_ userInfo: [AnyHashable: Any], completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    var handled = false
    for delegate in delegates {
      handled = delegate.didReceive(userInfo, completionHandler: completionHandler) || handled
    }
    if !handled {
      completionHandler(.noData)
    }
  }
}

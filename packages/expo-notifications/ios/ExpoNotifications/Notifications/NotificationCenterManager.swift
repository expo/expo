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
 Completion handler that takes the presentation options of a delegate, and drops them because
 another delegate answers the notification center instead.
 */
private let discardPresentationOptions: (UNNotificationPresentationOptions) -> Void = { _ in }

/**
 Singleton that sets itself as the UserNotificationCenter delegate,
 and calls its own delegates in response to notification center calls.
 The notification center keeps a single delegate, so a delegate that another library set before
 us becomes the chained delegate and receives every notification center call too.
 */
public class NotificationCenterManager: NSObject,
  UNUserNotificationCenterDelegate,
  NotificationDelegate {
  @objc
  public static let shared = NotificationCenterManager()

  var delegates: [NotificationDelegate] = []
  var pendingResponses: [UNNotificationResponse] = []

  /**
   Delegate of the notification center that another library set before us. We forward every
   notification center call to it, so that the other library keeps working.
   */
  private weak var chainedDelegate: UNUserNotificationCenterDelegate?

  private override init() {
    super.init()
    install()
  }

  /**
   Sets this manager as the delegate of the notification center, and keeps the delegate of another
   library in the chain, so that both this manager and the other library receive notification
   center calls. Call this from your app if a library sets its own delegate after
   expo-notifications has started.
   */
  @objc
  public func installAsNotificationCenterDelegate() {
    install()
  }

  private func install() {
    let notificationCenter = UNUserNotificationCenter.current()
    let previousDelegate = notificationCenter.delegate
    if previousDelegate === self {
      return
    }
    notificationCenter.delegate = self
    guard let previousDelegate else {
      return
    }
    // A library that swizzles `setDelegate:` can keep its own delegate in the notification center
    // and forward the calls to the delegate that we set. Chaining back to such a library would
    // call it again for every call that it forwards, without an end.
    guard notificationCenter.delegate === self else {
      NSLog(
        "[expo-notifications] Couldn't become the delegate of UNUserNotificationCenter, because " +
        "\(type(of: previousDelegate)) keeps that delegate for itself. expo-notifications works only if that " +
        "library forwards notification center calls to the delegate that it replaced. If notifications don't " +
        "arrive, stop the other library from setting the delegate, or call " +
        "NotificationCenterManager.shared.installAsNotificationCenterDelegate() after the other library sets it."
      )
      return
    }
    chainedDelegate = previousDelegate
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
    delegates.removeAll { $0 === delegate }
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

    if handled {
      // One of our own delegates answers, so the chained delegate doesn't answer.
      chainedDelegate?.userNotificationCenter?(
        center,
        willPresent: notification,
        withCompletionHandler: discardPresentationOptions
      )
    } else {
      // None of our own delegates answers, so the chained delegate answers instead.
      let answered: Void? = chainedDelegate?.userNotificationCenter?(
        center,
        willPresent: notification,
        withCompletionHandler: completionHandler
      )
      if answered == nil {
        // There's no chained delegate, or it doesn't present notifications, so present nothing.
        completionHandler([])
      }
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
    chainedDelegate?.userNotificationCenter?(center, didReceive: response, withCompletionHandler: completionHandler)
    completionHandler()
  }

  public func userNotificationCenter(_ center: UNUserNotificationCenter, openSettingsFor notification: UNNotification?) {
    for delegate in delegates {
      delegate.openSettings(notification)
    }
    chainedDelegate?.userNotificationCenter?(center, openSettingsFor: notification)
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

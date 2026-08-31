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
 The delegates of `NotificationCenterManager`, and the responses that arrived before any delegate
 could handle them.

 The manager is a process-wide singleton, but app contexts are not: the modules of an incoming
 context register themselves while an outgoing context tears its own down, which happens on every
 dev-client reload and on `Updates.reloadAsync()`. Both arrays are therefore written from more than
 one thread at a time, so they live behind a lock.
 */
internal final class NotificationDelegateRegistry {
  private let state = Mutex(State())

  private struct State {
    var delegates: [NotificationDelegate] = []
    var pendingResponses: [UNNotificationResponse] = []
  }

  /**
   A snapshot of the delegates. Callers iterate the snapshot instead of holding the lock across a
   delegate callback: `add` hands back the pending responses so that the caller can offer them to
   the delegate it just added, and a delegate is free to add or remove delegates from there.
   */
  var delegates: [NotificationDelegate] {
    state.withLock { $0.delegates }
  }

  var pendingResponses: [UNNotificationResponse] {
    state.withLock { $0.pendingResponses }
  }

  /**
   Adds the delegate, and returns the responses that it still has to be offered.
   */
  func add(_ delegate: NotificationDelegate) -> [UNNotificationResponse] {
    state.withLock { state in
      state.delegates.append(delegate)
      return state.pendingResponses
    }
  }

  func remove(_ delegate: AnyObject) {
    state.withLock { $0.delegates.removeAll { $0 === delegate } }
  }

  func appendPendingResponse(_ response: UNNotificationResponse) {
    state.withLock { $0.pendingResponses.append(response) }
  }

  func removeAllPendingResponses() {
    state.withLock { $0.pendingResponses.removeAll() }
  }
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

  private let registry = NotificationDelegateRegistry()

  var delegates: [NotificationDelegate] {
    registry.delegates
  }

  var pendingResponses: [UNNotificationResponse] {
    registry.pendingResponses
  }

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
    var handled = false
    for pendingResponse in registry.add(delegate) {
      handled = delegate.didReceive(pendingResponse, completionHandler: {}) || handled
    }
    if handled {
      registry.removeAllPendingResponses()
    }
  }

  public func removeDelegate(_ delegate: AnyObject) {
    registry.remove(delegate)
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
      registry.appendPendingResponse(response)
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

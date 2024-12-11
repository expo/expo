import ExpoModulesCore
import Foundation

/**
 Protocols that NotificationCenterManager delegates may implement
 */
public protocol NotificationPresentationDelegate: AnyObject {
  func willPresent(_ notification: UNNotification, completionHandler: @escaping (UNNotificationPresentationOptions) -> Void)
}

public protocol NotificationResponseDelegate: AnyObject {
  func didReceive(_ response: UNNotificationResponse, completionHandler: @escaping () -> Void)
}
public protocol NotificationSettingsDelegate: AnyObject {
  func openSettings(_ notification: UNNotification?)
}

public protocol NotificationRegistrationSuccessDelegate: AnyObject {
  func didRegister(_ deviceToken: String)
}

public protocol NotificationRegistrationFailureDelegate: AnyObject {
  func didFailRegistration(_ error: Error)
}

/**
 Singleton that sets itself as the UserNotificationCenter delegate,
 and calls its own delegates in response to notification center calls.
 */
@objc(EXNotificationCenterManager)
public class NotificationCenterManager: NSObject,
  UNUserNotificationCenterDelegate,
  NotificationRegistrationFailureDelegate,
  NotificationRegistrationSuccessDelegate {
  @objc
  public static let shared = NotificationCenterManager()

  var delegates: [AnyObject] = []
  var pendingResponses: [UNNotificationResponse] = []
  let userNotificationCenter: UNUserNotificationCenter = UNUserNotificationCenter.current()

  private override init() {
    super.init()
    if UNUserNotificationCenter.current().delegate != nil {
      NSLog(
        "[expo-notifications] EXNotificationCenterDelegate encountered already present delegate of " +
        "UNUserNotificationCenter. EXNotificationCenterDelegate will not overwrite the value not to break other " +
        "features of your app.  In return, expo-notifications may not work properly.  To fix this problem either " +
        "remove setting of the second delegate, or set the delegate to an instance of EXNotificationCenterDelegate " +
        "manually afterwards."
      )
      return
    }
    UNUserNotificationCenter.current().delegate = self
  }

  public func addDelegate(_ delegate: AnyObject) {
    delegates.append(delegate)
    if let delegate = delegate as? NotificationResponseDelegate {
      for pendingResponse in pendingResponses {
        delegate.didReceive(pendingResponse, completionHandler: {})
      }
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
      if let delegate = delegate as? NotificationRegistrationFailureDelegate {
        delegate.didFailRegistration(error)
      }
    }
  }

  public func didRegister(_ deviceToken: String) {
    for delegate in delegates {
      if let delegate = delegate as? NotificationRegistrationSuccessDelegate {
        delegate.didRegister(deviceToken)
      }
    }
  }

  // MARK: - UNUserNotificationCenterDelegate

  public func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    for delegate in delegates {
      if let delegate = delegate as? NotificationPresentationDelegate {
        delegate.willPresent(notification, completionHandler: completionHandler)
      }
    }
    completionHandler([])
  }

  public func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    var handled = false
    for delegate in delegates {
      if let delegate = delegate as? NotificationResponseDelegate {
        delegate.didReceive(response, completionHandler: completionHandler)
      }
      handled = true
    }
    if !handled {
      pendingResponses.append(response)
    }
    completionHandler()
  }

  public func userNotificationCenter(_ center: UNUserNotificationCenter, openSettingsFor notification: UNNotification?) {
    for delegate in delegates {
      if let delegate = delegate as? NotificationSettingsDelegate {
        delegate.openSettings(notification)
      }
    }
  }
}

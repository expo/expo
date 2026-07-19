import ExpoModulesCore
import Foundation

public class NotificationsAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  let notificationCenterManager = NotificationCenterManager.shared

  public func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    notificationCenterManager.didRegister(dataToString(deviceToken))
  }

  public func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: any Error
  ) {
    notificationCenterManager.didFailRegistration(error)
  }

  public func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    notificationCenterManager.didReceive(userInfo, completionHandler: completionHandler)
  }
}

private func dataToString(_ data: Data) -> String {
  return data.map { String(format: "%02hhx", $0) }.joined()
}

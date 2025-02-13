import ExpoModulesCore
import Foundation

public class NotificationsAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  let notificationCenterManager = NotificationCenterManager.shared

  public func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    notificationCenterManager.didRegister(dataToString(deviceToken))
  }

  public func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: any Error) {
    notificationCenterManager.didFailRegistration(error)
  }
}

private func dataToString(_ data: Data) -> String {
  return data.map { String(format: "%02hhx", $0) }.joined()
}

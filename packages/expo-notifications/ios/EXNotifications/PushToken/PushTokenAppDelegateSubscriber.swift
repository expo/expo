import ExpoModulesCore
import Foundation

public class PushTokenAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public static let ExpoNotificationsRegistrationResult = Notification.Name("ExpoNotificationsRegistrationResult")

  public func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    NotificationCenter.default.post(
      name: PushTokenAppDelegateSubscriber.ExpoNotificationsRegistrationResult,
      object: nil,
      userInfo: ["deviceToken": dataToString(deviceToken)]
    )
  }

  public func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: any Error) {
    NotificationCenter.default.post(
      name: PushTokenAppDelegateSubscriber.ExpoNotificationsRegistrationResult,
      object: nil,
      userInfo: ["error": error]
    )
  }

  private func dataToString(_ data: Data) -> String {
    return data.map { String(format: "%02hhx", $0) }.joined()
  }
}

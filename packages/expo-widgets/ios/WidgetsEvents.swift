import Foundation

public enum WidgetsEventType: String {
  case userEvent = "ExpoWidgetsUserInteraction"
}

let pendingUserInteractionsKey = "__expo_widgets_pending_user_interactions"
let maxPendingUserInteractions = 50

public class WidgetsEvents {
  public static let shared = WidgetsEvents()

  private init() {}

  // Darwin notifications are system-wide, so the name is scoped to the app group.
  static var darwinNotificationName: CFNotificationName? {
    guard let appGroupIdentifier = WidgetsStorage.appGroupIdentifier else {
      return nil
    }
    return CFNotificationName("\(appGroupIdentifier).\(WidgetsEventType.userEvent.rawValue)" as CFString)
  }

  public func sendNotification(type: WidgetsEventType, data: [String: Any]) {
    var eventData = data
    eventData["type"] = type.rawValue

    // Widget intents run in the widget extension process, where `NotificationCenter.default`
    // can't reach the app. Queue the event in the app group and notify the app with a Darwin notification.
    if Bundle.main.bundleURL.pathExtension == "appex" {
      guard let name = WidgetsEvents.darwinNotificationName else {
        return
      }
      var pending = WidgetsStorage.getArray(forKey: pendingUserInteractionsKey) as? [[String: Any]] ?? []
      pending.append(eventData)
      WidgetsStorage.set(Array(pending.suffix(maxPendingUserInteractions)), forKey: pendingUserInteractionsKey)
      CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(), name, nil, nil, true)
      return
    }

    let userInfo = ["eventData": eventData] as [String: Any]
    NotificationCenter.default.post(name: onUserInteractionNotification, object: nil, userInfo: userInfo)
  }

  func takePendingEvents() -> [[String: Any]] {
    guard let pending = WidgetsStorage.getArray(forKey: pendingUserInteractionsKey) as? [[String: Any]] else {
      return []
    }
    WidgetsStorage.removeObject(forKey: pendingUserInteractionsKey)
    return pending
  }
}

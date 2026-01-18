public enum WidgetsEventType: String {
  case userEvent = "ExpoWidgetsUserInteraction"
}

public class WidgetsEvents {
  public static let shared = WidgetsEvents()
  
  private init() {}
  
  public func sendNotification(type: WidgetsEventType, data: [String: Any]) {
    var eventData = data
    eventData["type"] = type.rawValue
    let userInfo = ["eventData": eventData] as [String: Any]
    NotificationCenter.default.post(name: onUserInteractionNotification, object: nil, userInfo: userInfo)
  }
}

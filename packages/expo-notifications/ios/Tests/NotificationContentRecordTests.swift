import Testing
import Foundation
import UserNotifications

@testable import ExpoNotifications

@Suite("NotificationContentRecord")
struct NotificationContentRecordTests {
  @Suite("given a remote notification")
  struct RemoteNotificationTests {
    @Test
    func `which has custom keys at the top level, puts them in data`() {
      let request = makePushRequest(userInfo: [
        "aps": ["alert": ["title": "t"]],
        "action": "open",
        "id": "42"
      ])

      let data = NotificationContentRecord(from: request).data

      #expect(data?["action"] as? String == "open")
      #expect(data?["id"] as? String == "42")
      #expect(data?["aps"] == nil)
    }

    @Test
    func `which has a body JSON string, uses the parsed body as data`() {
      let request = makePushRequest(userInfo: [
        "aps": ["alert": ["title": "t"]],
        "body": "{\"id\":\"42\"}"
      ])

      let data = NotificationContentRecord(from: request).data

      #expect(data?["id"] as? String == "42")
    }
  }
}

private func makePushRequest(userInfo: [AnyHashable: Any]) -> UNNotificationRequest {
  let content = UNMutableNotificationContent()
  content.userInfo = userInfo
  return UNNotificationRequest(identifier: "id", content: content, trigger: makePushTrigger())
}

// UNPushNotificationTrigger has no public initializer.
private func makePushTrigger() -> UNNotificationTrigger {
  let archiver = NSKeyedArchiver(requiringSecureCoding: true)
  archiver.setClassName("UNPushNotificationTrigger", for: UNTimeIntervalNotificationTrigger.self)
  archiver.encode(UNTimeIntervalNotificationTrigger(timeInterval: 60, repeats: false), forKey: "trigger")
  archiver.finishEncoding()
  let unarchiver = try! NSKeyedUnarchiver(forReadingFrom: archiver.encodedData)
  unarchiver.requiresSecureCoding = false
  return unarchiver.decodeObject(forKey: "trigger") as! UNNotificationTrigger
}

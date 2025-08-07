//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UserNotifications
import CoreLocation

let notificationResponseDefaultActionIdentifier = "expo.modules.notifications.actions.DEFAULT"

// MARK: - Notification Serializer Records

public struct InterruptionLevelRecord: Record {
  @Field
  var value: String

  public init() {}

  @available(iOS 15.0, *)
  public init(from interruptionLevel: UNNotificationInterruptionLevel) {
    self.value = switch interruptionLevel {
    case .passive: "passive"
    case .active: "active"
    case .timeSensitive: "timeSensitive"
    case .critical: "critical"
    @unknown default: "passive"
    }
  }

  public init(from string: String) {
    self.value = string
  }

  @available(iOS 15.0, *)
  func toUNNotificationInterruptionLevel() -> UNNotificationInterruptionLevel {
    return switch value {
    case "passive": .passive
    case "active": .active
    case "timeSensitive": .timeSensitive
    case "critical": .critical
    default: .passive
    }
  }
}

public struct NotificationAttachmentRecord: Record {
  @Field
  var identifier: String?
  @Field
  var url: String?
  @Field
  var type: String?

  public init() {}

  public init(from attachment: UNNotificationAttachment) {
    self.identifier = attachment.identifier.isEmpty ? nil : attachment.identifier
    self.url = attachment.url.absoluteString
    self.type = attachment.type.isEmpty ? nil : attachment.type
  }
}

public struct NotificationRegionRecord: Record {
  @Field
  var identifier: String
  @Field
  var type: String
  @Field
  var notifyOnEntry: Bool
  @Field
  var notifyOnExit: Bool
  @Field
  var center: [String: Double]?
  @Field
  var radius: Double?
  @Field
  var major: Int?
  @Field
  var minor: Int?
  @Field
  var uuid: String?
  @Field
  var beaconIdentityConstraint: [String: Any]?
  @Field
  var notifyEntryStateOnDisplay: Bool?

  public init() {}

  public init(from region: CLRegion) {
    self.identifier = region.identifier
    self.notifyOnEntry = region.notifyOnEntry
    self.notifyOnExit = region.notifyOnExit

    if let circularRegion = region as? CLCircularRegion {
      self.type = "circular"
      self.center = [
        "latitude": circularRegion.center.latitude,
        "longitude": circularRegion.center.longitude
      ]
      self.radius = circularRegion.radius
    } else if let beaconRegion = region as? CLBeaconRegion {
      self.type = "beacon"
      self.notifyEntryStateOnDisplay = beaconRegion.notifyEntryStateOnDisplay
      self.major = beaconRegion.major?.intValue
      self.minor = beaconRegion.minor?.intValue
      self.uuid = beaconRegion.uuid.uuidString
      self.beaconIdentityConstraint = [
        "uuid": beaconRegion.beaconIdentityConstraint.uuid.uuidString,
        "major": beaconRegion.beaconIdentityConstraint.major as Any,
        "minor": beaconRegion.beaconIdentityConstraint.minor as Any
      ]
    } else {
      self.type = "unknown"
    }
  }
}

public struct NotificationDateComponentsRecord: Record {
  @Field
  var calendar: String?
  @Field
  var timeZone: String?
  @Field
  var isLeapMonth: Bool
  @Field
  var era: Int?
  @Field
  var year: Int?
  @Field
  var month: Int?
  @Field
  var day: Int?
  @Field
  var hour: Int?
  @Field
  var minute: Int?
  @Field
  var second: Int?
  @Field
  var weekday: Int?
  @Field
  var weekdayOrdinal: Int?
  @Field
  var quarter: Int?
  @Field
  var weekOfMonth: Int?
  @Field
  var weekOfYear: Int?
  @Field
  var yearForWeekOfYear: Int?
  @Field
  var nanosecond: Int?

  public init() {}

  public init(from dateComponents: DateComponents) {
    self.calendar = dateComponents.calendar.map { String(describing: $0.identifier) }
    self.timeZone = dateComponents.timeZone?.description
    self.isLeapMonth = dateComponents.isLeapMonth ?? false

    func valueForComponent(_ component: Calendar.Component) -> Int? {
      let value = dateComponents.value(for: component)
      return value != NSDateComponentUndefined ? value : nil
    }

    self.era = valueForComponent(.era)
    self.year = valueForComponent(.year)
    self.month = valueForComponent(.month)
    self.day = valueForComponent(.day)
    self.hour = valueForComponent(.hour)
    self.minute = valueForComponent(.minute)
    self.second = valueForComponent(.second)
    self.weekday = valueForComponent(.weekday)
    self.weekdayOrdinal = valueForComponent(.weekdayOrdinal)
    self.quarter = valueForComponent(.quarter)
    self.weekOfMonth = valueForComponent(.weekOfMonth)
    self.weekOfYear = valueForComponent(.weekOfYear)
    self.yearForWeekOfYear = valueForComponent(.yearForWeekOfYear)
    self.nanosecond = valueForComponent(.nanosecond)
  }
}

public struct NotificationTriggerRecord: Record {
  @Field
  var `class`: String
  @Field
  var type: String
  @Field
  var repeats: Bool?
  @Field
  var payload: [AnyHashable: Any]?
  @Field
  var dateComponents: NotificationDateComponentsRecord?
  @Field
  var region: NotificationRegionRecord?
  @Field
  var seconds: Double?

  public init() {}

  public init(from request: UNNotificationRequest) {
    guard let trigger = request.trigger else {
      self.class = "UNNotificationTrigger"
      self.type = "unknown"
      return
    }

    self.class = String(describing: trigger.self)
    self.repeats = trigger.repeats

    if trigger is UNPushNotificationTrigger {
      self.type = "push"
      self.payload = request.content.userInfo
    } else if let calendarTrigger = trigger as? UNCalendarNotificationTrigger {
      self.type = "calendar"
      self.dateComponents = NotificationDateComponentsRecord(from: calendarTrigger.dateComponents)
    // #if !targetEnvironment(macCatalyst)
    } else if let locationTrigger = trigger as? UNLocationNotificationTrigger {
      self.type = "location"
      self.region = NotificationRegionRecord(from: locationTrigger.region)
    // #endif
    } else if let timeIntervalTrigger = trigger as? UNTimeIntervalNotificationTrigger {
      self.type = "timeInterval"
      self.seconds = timeIntervalTrigger.timeInterval
    } else {
      self.type = "unknown"
    }
  }
}

public struct NotificationContentRecord: Record {
  @Field
  var title: String?
  @Field
  var subtitle: String?
  @Field
  var body: String?
  @Field
  var badge: Int?
  @Field
  var sound: String?
  @Field
  var launchImageName: String?
  @Field
  var data: [AnyHashable: Any]?
  @Field
  var attachments: [NotificationAttachmentRecord]
  @Field
  var categoryIdentifier: String?
  @Field
  var threadIdentifier: String?
  @Field
  var targetContentIdentifier: String?
  @Field
  var interruptionLevel: InterruptionLevelRecord?

  public init() {}

  public init(from request: UNNotificationRequest) {
    let content = request.content

    self.title = content.title.isEmpty ? nil : content.title
    self.subtitle = content.subtitle.isEmpty ? nil : content.subtitle
    self.body = content.body.isEmpty ? nil : content.body
    self.badge = content.badge?.intValue
    self.sound = NotificationSerializer.serializedNotificationSound(content.sound)
    self.launchImageName = content.launchImageName.isEmpty == false ? content.launchImageName : nil
    self.data = NotificationSerializer.serializedNotificationData(from: request)
    self.attachments = content.attachments.map { NotificationAttachmentRecord(from: $0) }
    self.categoryIdentifier = content.categoryIdentifier.isEmpty ? nil : content.categoryIdentifier
    self.threadIdentifier = content.threadIdentifier.isEmpty == false ? content.threadIdentifier : nil
    self.targetContentIdentifier = content.targetContentIdentifier?.isEmpty == false ? content.targetContentIdentifier : nil

    if #available(iOS 15.0, *) {
      self.interruptionLevel = InterruptionLevelRecord(from: content.interruptionLevel)
    }
  }
}

public struct NotificationRequestRecord: Record {
  @Field
  var identifier: String
  @Field
  var content: NotificationContentRecord
  @Field
  var trigger: NotificationTriggerRecord?

  public init() {}

  public init(from request: UNNotificationRequest) {
    self.identifier = request.identifier
    self.content = NotificationContentRecord(from: request)
    self.trigger = request.trigger != nil ? NotificationTriggerRecord(from: request) : nil
  }
}

public struct NotificationRecord: Record {
  @Field
  var request: NotificationRequestRecord
  @Field
  var date: Double

  public init() {}

  public init(from notification: UNNotification) {
    self.request = NotificationRequestRecord(from: notification.request)
    self.date = notification.date.timeIntervalSince1970
  }
}

public struct NotificationResponseRecord: Record {
  @Field
  var actionIdentifier: String
  @Field
  var notification: NotificationRecord
  @Field
  var userText: String?

  public init() {}

  public init(from response: UNNotificationResponse) {
    var actionIdentifier = response.actionIdentifier
    if actionIdentifier == UNNotificationDefaultActionIdentifier {
      actionIdentifier = notificationResponseDefaultActionIdentifier
    }

    self.actionIdentifier = actionIdentifier
    self.notification = NotificationRecord(from: response.notification)

    if let textInputResponse = response as? UNTextInputNotificationResponse {
      self.userText = textInputResponse.userText.isEmpty ? nil : textInputResponse.userText
    }
  }
}

// MARK: - NotificationSerializer

public class NotificationSerializer {
  public static func serializedNotificationResponse(_ response: UNNotificationResponse) -> [String: Any] {
    let record = NotificationResponseRecord(from: response)
    return record.toDictionary()
  }

  public static func serializedNotification(_ notification: UNNotification) -> [String: Any] {
    let record = NotificationRecord(from: notification)
    return record.toDictionary()
  }

  public static func serializedNotificationRequest(_ request: UNNotificationRequest) -> [String: Any] {
    let record = NotificationRequestRecord(from: request)
    return record.toDictionary()
  }

  public static func serializedNotificationContent(_ request: UNNotificationRequest) -> [String: Any] {
    let record = NotificationContentRecord(from: request)
    return record.toDictionary()
  }

  // MARK: - Helper methods

  static func serializedNotificationSound(_ sound: UNNotificationSound?) -> String? {
    guard let sound = sound else {
      return nil
    }

    if sound == UNNotificationSound.defaultCritical {
      return "defaultCritical"
    }

    if sound == UNNotificationSound.default {
      return "default"
    }

    return "custom"
  }

  static func serializedNotificationData(from request: UNNotificationRequest) -> [AnyHashable: Any]? {
    let isRemote = request.trigger is UNPushNotificationTrigger
    if isRemote {
      return request.content.userInfo["body"] as? [String: Any]
    }
    return request.content.userInfo
  }
}

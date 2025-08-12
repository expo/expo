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
  var identifier: String
  @Field
  var url: String?
  @Field
  var type: String?

  public init() {}

  public init(from attachment: UNNotificationAttachment) {
    self.identifier = attachment.identifier
    self.url = attachment.url.absoluteString
    self.type = attachment.type
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
  // TODO @vonovak 8/25 use ValueOrUndefinded for the rest when available
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

public struct NotificationTriggerRecord: Record {
  @Field
  var `class`: String
  @Field
  var type: String
  @Field
  var repeats: Bool?
  @Field
  var payload: [AnyHashable: Any]? // TODO @vonovak 8/25 use ValueOrUndefinded when available
  @Field
  var dateComponents: [AnyHashable: Any]?
  @Field
  var region: NotificationRegionRecord? // TODO @vonovak 8/25 use ValueOrUndefinded when available
  @Field
  var seconds: Double? // TODO @vonovak 8/25 use ValueOrUndefinded when available

  public init() {}

  public init(from request: UNNotificationRequest) {
    guard let trigger = request.trigger else {
      self.class = "UNNotificationTrigger"
      self.type = "unknown"
      return
    }

    self.class = NotificationSerializer.ClassName(of: trigger)
    self.repeats = trigger.repeats

    if trigger is UNPushNotificationTrigger {
      self.type = "push"
      self.payload = request.content.userInfo
    } else if let calendarTrigger = trigger as? UNCalendarNotificationTrigger {
      self.type = "calendar"
      self.dateComponents = DateComponentsSerializer.serializedDateComponents(calendarTrigger.dateComponents)
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
  @Field public
  var categoryIdentifier: String?
  @Field
  var threadIdentifier: String?
  @Field
  var targetContentIdentifier: String?
  @Field
  var interruptionLevel: String?

  public init() {}

  public init(from request: UNNotificationRequest) {
    let content = request.content

    self.title = content.title.isEmpty ? nil : content.title
    self.subtitle = content.subtitle.isEmpty ? nil : content.subtitle
    self.body = content.body.isEmpty ? nil : content.body
    self.badge = content.badge?.intValue
    self.sound = serializedNotificationSound(content.sound)
    self.launchImageName = content.launchImageName.isEmpty == false ? content.launchImageName : nil
    self.data = serializedNotificationData(from: request)
    self.attachments = content.attachments.map { NotificationAttachmentRecord(from: $0) }
    self.categoryIdentifier = content.categoryIdentifier.isEmpty ? nil : content.categoryIdentifier
    self.threadIdentifier = content.threadIdentifier.isEmpty == false ? content.threadIdentifier : nil
    self.targetContentIdentifier = content.targetContentIdentifier?.isEmpty == false ? content.targetContentIdentifier : nil

    if #available(iOS 15.0, *) {
      self.interruptionLevel = InterruptionLevelRecord(from: content.interruptionLevel).value
    }
  }

  func serializedNotificationSound(_ sound: UNNotificationSound?) -> String? {
    guard let sound = sound else {
      return nil
    }

    if sound == .defaultCritical {
      return "defaultCritical"
    }

    if #available(iOS 15.2, *) {
      if sound == .defaultRingtone {
        // TODO JS
        return "defaultRingtone"
      }
    }

    if sound == .default {
      return "default"
    }

    return "custom"
  }

  func serializedNotificationData(from request: UNNotificationRequest) -> [AnyHashable: Any]? {
    let isRemote = request.trigger is UNPushNotificationTrigger
    if isRemote {
      return request.content.userInfo["body"] as? [String: Any]
    }
    return request.content.userInfo
  }
}

public struct NotificationRequestRecord: Record {
  @Field public
  var identifier: String
  @Field public
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
  @Field public
  var request: NotificationRequestRecord
  @Field
  var date: Double

  public init() {}

  public init(from notification: UNNotification) {
    self.request = NotificationRequestRecord(from: notification.request)
    // TODO check the value
    self.date = notification.date.timeIntervalSince1970
  }
}

public struct NotificationResponseRecord: Record {
  @Field
  var actionIdentifier: String
  @Field public
  var notification: NotificationRecord
  @Field
  var userText: String? // TODO @vonovak 8/25 use ValueOrUndefinded when available

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

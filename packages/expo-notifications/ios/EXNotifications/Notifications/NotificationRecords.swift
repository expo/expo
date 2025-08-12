import ExpoModulesCore
import UserNotifications
import CoreLocation

let notificationResponseDefaultActionIdentifier = "expo.modules.notifications.actions.DEFAULT"

// MARK: - Notification Serializer Enums & Records

enum InterruptionLevelEnum: String, Enumerable {
  case active
  case passive
  case timeSensitive
  case critical

  public init(from interruptionLevel: UNNotificationInterruptionLevel) {
    self = switch interruptionLevel {
    case .passive: .passive
    case .active: .active
    case .timeSensitive: .timeSensitive
    case .critical: .critical
    @unknown default: .passive
    }
  }

  func toUNNotificationInterruptionLevel() -> UNNotificationInterruptionLevel {
    return switch self {
    case .passive: .passive
    case .active: .active
    case .timeSensitive: .timeSensitive
    case .critical: .critical
    }
  }
}

enum NotificationSoundEnum: String, Enumerable {
  case `default`
  case defaultCritical
  case defaultRingtone
  case custom

  public init(from sound: UNNotificationSound?) {
    if #available(iOS 15.2, *) {
      #if targetEnvironment(macCatalyst)
      self = switch sound {
      case .defaultCritical: .defaultCritical
      case .default: .default
      default: .custom
      }
      #else
      self = switch sound {
      case .defaultCritical: .defaultCritical
      case .defaultRingtone: .defaultRingtone
      case .default: .default
      default: .custom
      }
      #endif
    } else {
      self = switch sound {
      case .defaultCritical: .defaultCritical
      case .default: .default
      default: .custom
      }
    }
  }

  func toUNNotificationSound(customSoundName: String?) -> UNNotificationSound {
    switch self {
    case .default:
      return .default
    case .defaultCritical:
      return .defaultCritical
    case .defaultRingtone:
      #if targetEnvironment(macCatalyst)
      return .default
      #else
      if #available(iOS 15.2, *) {
        return .defaultRingtone
      } else {
        return .default
      }
      #endif
    case .custom:
      guard let soundName = customSoundName else {
        preconditionFailure("NotificationSoundEnum.custom requires a non-nil customSoundName")
      }
      return UNNotificationSound(named: UNNotificationSoundName(rawValue: soundName))
    }
  }
}

public struct ThumbnailClipAreaRecord: Record {
  @Field
  var x: Double
  @Field
  var y: Double
  @Field
  var width: Double
  @Field
  var height: Double

  public init() {}

  func toCGRect() -> CGRect {
    return CGRect(x: x, y: y, width: width, height: height)
  }
}

public struct NotificationAttachmentRecord: Record {
  @Field
  var identifier: String
  @Field
  var url: String?
  @Field
  var type: String?
  @Field
  var typeHint: String?
  @Field
  var hideThumbnail: Bool?
  @Field
  var thumbnailClipArea: ThumbnailClipAreaRecord?
  @Field
  var thumbnailTime: Double?

  public init() {}

  public init(from attachment: UNNotificationAttachment) {
    self.identifier = attachment.identifier
    self.url = attachment.url.absoluteString
    self.type = attachment.type
  }

  func toUNNotificationAttachment() -> UNNotificationAttachment? {
    guard let urlString = url,
          let attachmentURL = URL(string: urlString) else {
      return nil
    }

    var options: [String: Any] = [:]

    if let typeHint = typeHint {
      options[UNNotificationAttachmentOptionsTypeHintKey] = typeHint
    }

    if let hideThumbnail = hideThumbnail {
      options[UNNotificationAttachmentOptionsThumbnailHiddenKey] = hideThumbnail
    }

    if let thumbnailClipArea = thumbnailClipArea {
      options[UNNotificationAttachmentOptionsThumbnailClippingRectKey] = thumbnailClipArea.toCGRect()
    }

    if let thumbnailTime = thumbnailTime {
      options[UNNotificationAttachmentOptionsThumbnailTimeKey] = thumbnailTime
    }

    return try? UNNotificationAttachment(
      identifier: identifier,
      url: attachmentURL,
      options: options.isEmpty ? nil : options
    )
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

      #if targetEnvironment(macCatalyst)
      // On Mac Catalyst, CLBeaconIdentityConstraint does not expose major/minor accessors.
      self.beaconIdentityConstraint = [
        "uuid": beaconRegion.beaconIdentityConstraint.uuid.uuidString
      ]
      #else
      self.beaconIdentityConstraint = [
        "uuid": beaconRegion.beaconIdentityConstraint.uuid.uuidString,
        "major": beaconRegion.beaconIdentityConstraint.major as Any,
        "minor": beaconRegion.beaconIdentityConstraint.minor as Any
      ]
      #endif
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
  var payload: ValueOrUndefined<[AnyHashable: Any]?> = .undefined
  @Field
  var dateComponents: [AnyHashable: Any]?
  @Field
  var region: ValueOrUndefined<NotificationRegionRecord> = .undefined
  @Field
  var seconds: ValueOrUndefined<Double> = .undefined

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
      self.payload = .value(unwrapped: request.content.userInfo)
    } else if let calendarTrigger = trigger as? UNCalendarNotificationTrigger {
      self.type = "calendar"
      self.dateComponents = DateComponentsSerializer.serializedDateComponents(calendarTrigger.dateComponents)
    } else if let timeIntervalTrigger = trigger as? UNTimeIntervalNotificationTrigger {
      self.type = "timeInterval"
      self.seconds = .value(unwrapped: timeIntervalTrigger.timeInterval)
    } else {
      self.type = "unknown"
      #if !targetEnvironment(macCatalyst)
      if let locationTrigger = trigger as? UNLocationNotificationTrigger {
        self.type = "location"
        self.region = .value(unwrapped: NotificationRegionRecord(from: locationTrigger.region))
      }
      #endif
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
  var sound: Either<Bool, String>?
  @Field
  var launchImageName: String?
  @Field public
  var data: [String: Any]?
  @Field
  var attachments: [NotificationAttachmentRecord]?
  @Field public
  var categoryIdentifier: String?
  @Field
  var threadIdentifier: String?
  @Field
  var targetContentIdentifier: String?
  @Field
  var interruptionLevel: InterruptionLevelEnum?

  public init() {}

  public init(from request: UNNotificationRequest) {
    let content = request.content

    self.title = content.title.isEmpty ? nil : content.title
    self.subtitle = content.subtitle.isEmpty ? nil : content.subtitle
    self.body = content.body.isEmpty ? nil : content.body
    self.badge = content.badge?.intValue

    if let sound = content.sound {
      let soundValue = NotificationSoundEnum(from: sound).rawValue
      self.sound = Either<Bool, String>(soundValue)
    }

    self.launchImageName = content.launchImageName.isEmpty ? nil : content.launchImageName
    self.data = serializedNotificationData(from: request) as? [String: Any]
    self.attachments = content.attachments.map { NotificationAttachmentRecord(from: $0) }
    self.categoryIdentifier = content.categoryIdentifier.isEmpty ? nil : content.categoryIdentifier
    self.threadIdentifier = content.threadIdentifier.isEmpty ? nil : content.threadIdentifier
    self.targetContentIdentifier = content.targetContentIdentifier?.isEmpty == false ? content.targetContentIdentifier : nil

    self.interruptionLevel = InterruptionLevelEnum(from: request.content.interruptionLevel)
  }

  func serializedNotificationData(from request: UNNotificationRequest) -> [AnyHashable: Any]? {
    let isRemote = request.trigger is UNPushNotificationTrigger
    if isRemote {
      return request.content.userInfo["body"] as? [String: Any]
    }
    return request.content.userInfo
  }

  func toUNMutableNotificationContent() -> UNMutableNotificationContent {
    let content = UNMutableNotificationContent()

    if let title = title {
      content.title = title
    }

    if let subtitle = subtitle {
      content.subtitle = subtitle
    }

    if let body = body {
      content.body = body
    }

    if let launchImageName = launchImageName {
      content.launchImageName = launchImageName
    }

    if let badge = badge {
      // swiftlint:disable:next legacy_objc_type
      content.badge = NSNumber.init(value: badge)
    }

    if let userInfo = data {
      content.userInfo = userInfo
    }

    if let categoryIdentifier = categoryIdentifier {
      content.categoryIdentifier = categoryIdentifier
    }

    if let sound = sound {
      if let soundBool = try? sound.as(Bool.self) {
        content.sound = soundBool ? .default : .none
      } else if let soundName = try? sound.as(String.self) {
        let soundEnum = NotificationSoundEnum(rawValue: soundName) ?? .custom
        content.sound = soundEnum.toUNNotificationSound(customSoundName: soundName)
      }
    } else {
      // to behave the same as android, otherwise there'd be no sound
      content.sound = .default
    }

    if let attachments = attachments {
      content.attachments = attachments.compactMap { $0.toUNNotificationAttachment() }
    }

    if let interruptionLevel = interruptionLevel {
      content.interruptionLevel = interruptionLevel.toUNNotificationInterruptionLevel()
    }

    return content
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
    self.date = notification.date.timeIntervalSince1970
  }
}

public struct NotificationResponseRecord: Record {
  @Field
  var actionIdentifier: String
  @Field public
  var notification: NotificationRecord
  @Field
  var userText: ValueOrUndefined<String> = .undefined

  public init() {}

  public init(from response: UNNotificationResponse) {
    // TODO vonovak check if we need to support UNNotificationDismissActionIdentifier
    self.actionIdentifier = response.actionIdentifier == UNNotificationDefaultActionIdentifier ? notificationResponseDefaultActionIdentifier : response.actionIdentifier

    self.notification = NotificationRecord(from: response.notification)

    if let textInputResponse = response as? UNTextInputNotificationResponse, textInputResponse.userText.isEmpty == false {
      self.userText = .value(unwrapped: textInputResponse.userText)
    }
  }
}


//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore

struct NotificationRequestRecord: Record {
  @Field
  var title: String?
  @Field
  var subtitle: String?
  @Field
  var body: String?
  @Field
  var launchImageName: String?
  @Field
  var badge: Int?
  @Field
  var userInfo: [String: Any]?
  @Field
  var categoryIdentifier: String?
  @Field
  var sound: Either<Bool, String>?
  @Field
  var attachments: [[String: Any]]?
  @Field
  var interruptionLevel: String?
}

public class NotificationBuilder: NSObject {
  public class func content(_ request: [String: Any], appContext: AppContext) throws -> UNMutableNotificationContent {
    let content = UNMutableNotificationContent()
    let request = try NotificationRequestRecord(from: request, appContext: appContext)

    if let title = request.title {
      content.title = title
    }

    if let subtitle = request.subtitle {
      content.subtitle = subtitle
    }

    if let body = request.body {
      content.body = body
    }

    if let launchImageName = request.launchImageName {
      content.launchImageName = launchImageName
    }

    if let badge = request.badge {
      // swiftlint:disable:next legacy_objc_type
      content.badge = NSNumber.init(value: badge)
    }

    if let userInfo = request.userInfo {
      content.userInfo = userInfo
    }

    if let categoryIdentifier = request.categoryIdentifier {
      content.categoryIdentifier = categoryIdentifier
    }

    if let sound = request.sound {
      if let soundBool = try? sound.as(Bool.self) {
        content.sound = soundBool ? .default : .none
      } else if let soundName = try? sound.as(String.self) {
        if soundName == "default" {
          content.sound = UNNotificationSound.default
        } else if soundName == "defaultCritical" {
          content.sound = UNNotificationSound.defaultCritical
        } else {
          content.sound = UNNotificationSound(named: UNNotificationSoundName(rawValue: soundName))
        }
      }
    }

    var attachments: [UNNotificationAttachment] = []
    if let attachmentsArray = request.attachments {
      for attachmentObject in attachmentsArray {
        if let attachment: UNNotificationAttachment = attachment(attachmentObject) {
          attachments.append(attachment)
        }
      }
    }
    content.attachments = attachments
    if let interruptionLevel = request.interruptionLevel {
      content.interruptionLevel = deserializeInterruptionLevel(interruptionLevel)
    }

    return content
  }

  class func attachment(_ request: [String: Any]) -> UNNotificationAttachment? {
    let identifier = request["identifier"] as? String ?? ""
    let uri = request["uri"] as? String ?? ""
    do {
      if let url = URL(string: uri),
        let attachment: UNNotificationAttachment =
          try? UNNotificationAttachment(
            identifier: identifier,
            url: url,
            options: attachmentOptions(request)
          ) {
        return attachment
      }
      return nil
    }
  }

  class func attachmentOptions(_ request: [String: Any]) -> [String: Any] {
    var options: [String: Any] = [:]
    if let typeHint = request["typeHint"] as? String {
      options[UNNotificationAttachmentOptionsTypeHintKey] = typeHint
    }
    if let hideThumbnail = request["hideThumbnail"] as? Bool {
      options[UNNotificationAttachmentOptionsThumbnailHiddenKey] = hideThumbnail
    }
    if let thumbnailClipArea = request["thumbnailClipArea"] as? [String: Any] {
      let x = thumbnailClipArea["x"] as? Double
      let y = thumbnailClipArea["y"] as? Double
      let width = thumbnailClipArea["width"] as? Double
      let height = thumbnailClipArea["height"] as? Double
      if let x, let y, let width, let height {
        options[UNNotificationAttachmentOptionsThumbnailClippingRectKey] =
          CGRect(
            x: x,
            y: y,
            width: width,
            height: height
          )
      }
    }
    if let thumbnailTime = request["thumbnailTime"] as? TimeInterval {
      options[UNNotificationAttachmentOptionsThumbnailTimeKey] = thumbnailTime
    }
    return options
  }

  class func deserializeInterruptionLevel(_ interruptionLevel: String) -> UNNotificationInterruptionLevel {
    switch interruptionLevel {
    case "passive": return .passive
    case "active": return .active
    case "timeSensitive": return .timeSensitive
    case "critical": return .critical
    default: return .passive
    }
  }
}

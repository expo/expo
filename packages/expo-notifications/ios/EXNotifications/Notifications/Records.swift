//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore

// MARK: - NotificationBuilder record definitions

public protocol TriggerRecord: Record {
  func toUNNotificationTrigger() throws -> UNNotificationTrigger?
}

public struct CalendarTriggerRecord: TriggerRecord {
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
  var weekOfMonth: Int?
  @Field
  var weekOfYear: Int?
  @Field
  var weekdayOrdinal: Int?
  @Field
  var timezone: String?
  @Field
  var repeats: Bool?

  let dateComponentsMatchMap: [String: Calendar.Component] = [
    "year": .year,
    "month": .month,
    "day": .day,
    "hour": .hour,
    "minute": .minute,
    "second": .second,
    "weekday": .weekday,
    "weekOfMonth": .weekOfMonth,
    "weekOfYear": .weekOfYear,
    "weekdayOrdinal": .weekdayOrdinal
  ]

  public init() {}

  func dateComponentsFrom(_ calendarTrigger: CalendarTriggerRecord) -> DateComponents {
    var dateComponents = DateComponents()
    // TODO: Verify that DoW matches JS getDay()
    dateComponents.calendar = Calendar.init(identifier: .iso8601)
    if let timeZone = calendarTrigger.timezone {
      dateComponents.timeZone = TimeZone(identifier: timeZone)
    }
    let triggerAsDict = calendarTrigger.toDictionary()
    dateComponentsMatchMap.forEach { key, keyVal in
      if let value = triggerAsDict[key] as? Int {
        dateComponents.setValue(value, for: keyVal)
      }
    }
    return dateComponents
  }

  public func toUNNotificationTrigger() throws -> UNNotificationTrigger? {
    var trigger: UNNotificationTrigger?
    try EXUtilities.catchException {
      let dateComponents: DateComponents = dateComponentsFrom(self)
      let repeats = self.repeats ?? false
      trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: repeats)
    }
    return trigger
  }
}

public struct TimeIntervalTriggerRecord: TriggerRecord {
  @Field
  var seconds: TimeInterval
  @Field
  var repeats: Bool

  public init() {}

  public func toUNNotificationTrigger() throws -> UNNotificationTrigger? {
    var trigger: UNNotificationTrigger?
    try EXUtilities.catchException {
      trigger = UNTimeIntervalNotificationTrigger(timeInterval: self.seconds, repeats: self.repeats)
    }
    return trigger
  }
}

public struct DateTriggerRecord: TriggerRecord {
  @Field
  var timestamp: TimeInterval

  public init() {}

  public func toUNNotificationTrigger() throws -> UNNotificationTrigger? {
    let timestamp: Int = Int(self.timestamp / 1000)
    let date: Date = Date(timeIntervalSince1970: TimeInterval(timestamp))
    var trigger: UNNotificationTrigger?
    try EXUtilities.catchException {
      trigger = UNTimeIntervalNotificationTrigger(timeInterval: date.timeIntervalSinceNow, repeats: false)
    }
    return trigger
  }
}

public struct DailyTriggerRecord: TriggerRecord {
  @Field
  var hour: Int
  @Field
  var minute: Int

  public init() {}

  public func toUNNotificationTrigger() throws -> UNNotificationTrigger? {
    let dateComponents: DateComponents = DateComponents(hour: self.hour, minute: self.minute)
    var trigger: UNNotificationTrigger?
    try EXUtilities.catchException {
      trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
    }
    return trigger
  }
}

public struct WeeklyTriggerRecord: TriggerRecord {
  @Field
  var weekday: Int
  @Field
  var hour: Int
  @Field
  var minute: Int

  public init() {}

  public func toUNNotificationTrigger() throws -> UNNotificationTrigger? {
    let dateComponents: DateComponents = DateComponents(hour: self.hour, minute: self.minute, weekday: self.weekday)
    var trigger: UNNotificationTrigger?
    try EXUtilities.catchException {
      trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
    }
    return trigger  }
}

public struct MonthlyTriggerRecord: TriggerRecord {
  @Field
  var day: Int
  @Field
  var hour: Int
  @Field
  var minute: Int

  public init() {}

  public func toUNNotificationTrigger() throws -> UNNotificationTrigger? {
    let dateComponents: DateComponents = DateComponents(day: self.day, hour: self.hour, minute: self.minute)
    var trigger: UNNotificationTrigger?
    try EXUtilities.catchException {
      trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
    }
    return trigger
  }
}

public struct YearlyTriggerRecord: TriggerRecord {
  @Field
  var month: Int
  @Field
  var day: Int
  @Field
  var hour: Int
  @Field
  var minute: Int

  public init() {}

  public func toUNNotificationTrigger() throws -> UNNotificationTrigger? {
    let dateComponents: DateComponents = DateComponents(
      month: self.month + 1, // iOS months are 1-based, JS months are 0-based
      day: self.day,
      hour: self.hour,
      minute: self.minute
    )
    var trigger: UNNotificationTrigger?
    try EXUtilities.catchException {
      trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
    }
    return trigger
  }
}

// MARK: - Category record definitions

struct CategoryTextInputActionRecord: Record {
  init() {}

  @Field
  var title: String?
  @Field
  var placeholder: String?
  @Field
  var submitButtonTitle: String?

  init(_ textInputAction: UNTextInputNotificationAction) {
    self.title = textInputAction.title
    self.placeholder = textInputAction.textInputPlaceholder
    self.submitButtonTitle = textInputAction.textInputButtonTitle
  }

  func toUNTextInputNotificationAction(identifier: String, title: String, options: UNNotificationActionOptions) -> UNTextInputNotificationAction {
    return UNTextInputNotificationAction(
      identifier: identifier,
      title: title,
      options: options,
      textInputButtonTitle: submitButtonTitle ?? "",
      textInputPlaceholder: placeholder ?? ""
    )
  }
}

struct CategoryActionOptionsRecord: Record {
  init() {}

  @Field
  var isDestructive: Bool?
  @Field
  var isAuthenticationRequired: Bool?
  @Field
  var opensAppToForeground: Bool?

  init(_ options: UNNotificationActionOptions) {
    self.isDestructive = options.contains(.destructive)
    self.isAuthenticationRequired = options.contains(.authenticationRequired)
    self.opensAppToForeground = options.contains(.foreground)
  }
}

public struct CategoryActionRecord: Record {
  public init() {}

  @Field
  var identifier: String?
  @Field
  var buttonTitle: String?
  @Field
  var options: CategoryActionOptionsRecord?
  @Field
  var textInput: CategoryTextInputActionRecord?

  init(_ action: UNNotificationAction) {
    self.identifier = action.identifier
    self.buttonTitle = action.title
    self.options = CategoryActionOptionsRecord(action.options)
    if let textInputAction = action as? UNTextInputNotificationAction {
      self.textInput = CategoryTextInputActionRecord(textInputAction)
    }
  }

  func toUNNotificationAction() -> UNNotificationAction? {
    guard let identifier = identifier,
      let buttonTitle = buttonTitle else {
      return nil
    }

    var notificationOptions: UNNotificationActionOptions = []
    if let optionsParams = options {
      if optionsParams.opensAppToForeground == true {
        notificationOptions.insert(.foreground)
      }
      if optionsParams.isDestructive == true {
        notificationOptions.insert(.destructive)
      }
      if optionsParams.isAuthenticationRequired == true {
        notificationOptions.insert(.authenticationRequired)
      }
    }
    if let textInput = textInput {
      return textInput.toUNTextInputNotificationAction(identifier: identifier, title: buttonTitle, options: notificationOptions)
    }
    return UNNotificationAction(identifier: identifier, title: buttonTitle, options: notificationOptions)
  }
}

public struct CategoryOptionsRecord: Record {
  public init() {}

  // allowAnnouncement deprecated in iOS 15 and later but still exposed on the JS side
  // we set it to false because the option is ignored by iOS
  @Field
  var allowAnnouncement: Bool = false
  @Field
  var allowInCarPlay: Bool?
  @Field
  var categorySummaryFormat: String?
  @Field
  var customDismissAction: Bool?
  @Field
  var intentIdentifiers: [String]?
  @Field
  var previewPlaceholder: String?
  @Field
  var showTitle: Bool?
  @Field
  var showSubtitle: Bool?

  init(_ category: UNNotificationCategory) {
    self.allowInCarPlay = category.options.contains(.allowInCarPlay)
    self.categorySummaryFormat = category.categorySummaryFormat
    self.customDismissAction = category.options.contains(.customDismissAction)
    self.intentIdentifiers = category.intentIdentifiers
    self.previewPlaceholder = category.hiddenPreviewsBodyPlaceholder
    self.showTitle = category.options.contains(.hiddenPreviewsShowTitle)
    self.showSubtitle = category.options.contains(.hiddenPreviewsShowSubtitle)
  }

  func toUNNotificationCategoryOptions() -> UNNotificationCategoryOptions {
    var options: UNNotificationCategoryOptions = []
    if customDismissAction == true {
      options.insert(.customDismissAction)
    }
    if allowInCarPlay == true {
      options.insert(.allowInCarPlay)
    }
    if showTitle == true {
      options.insert(.hiddenPreviewsShowTitle)
    }
    if showSubtitle == true {
      options.insert(.hiddenPreviewsShowSubtitle)
    }
    return options
  }
}

public struct CategoryRecord: Record {
  public init() {}

  @Field
  public var identifier: String
  @Field
  var actions: [CategoryActionRecord]?
  @Field
  var options: CategoryOptionsRecord?

  public init(_ category: UNNotificationCategory) {
    self.identifier = category.identifier
    self.actions = category.actions.map { action in
      return CategoryActionRecord(action)
    }
    self.options = CategoryOptionsRecord(category)
  }

  public init(_ identifier: String, actions: [CategoryActionRecord], options: CategoryOptionsRecord?) {
    self.identifier = identifier
    self.actions = actions
    self.options = options
  }

  func toUNNotificationCategory() -> UNNotificationCategory {
    let intentIdentifiers: [String] = options?.intentIdentifiers ?? []
    let previewPlaceholder: String? = options?.previewPlaceholder
    let categorySummaryFormat: String? = options?.categorySummaryFormat
    let actionsArray = actions?.compactMap { action in
      return action.toUNNotificationAction()
    } ?? []
    let categoryOptions = options?.toUNNotificationCategoryOptions() ?? []
    return UNNotificationCategory(
      identifier: identifier,
      actions: actionsArray,
      intentIdentifiers: intentIdentifiers,
      hiddenPreviewsBodyPlaceholder: previewPlaceholder,
      categorySummaryFormat: categorySummaryFormat,
      options: categoryOptions
    )
  }
}

// MARK: - Notification request record definitions

struct NotificationRequestContentRecord: Record {
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
  var data: [String: Any]?
  @Field
  var categoryIdentifier: String?
  @Field
  var sound: Either<Bool, String>?
  @Field
  var attachments: [[String: Any]]?
  @Field
  var interruptionLevel: String?

  func attachment(_ request: [String: Any]) -> UNNotificationAttachment? {
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

  func attachmentOptions(_ request: [String: Any]) -> [String: Any] {
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

  func deserializeInterruptionLevel(_ interruptionLevel: String) -> UNNotificationInterruptionLevel {
    switch interruptionLevel {
    case "passive": return .passive
    case "active": return .active
    case "timeSensitive": return .timeSensitive
    case "critical": return .critical
    default: return .passive
    }
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
        if soundName == "default" {
          content.sound = UNNotificationSound.default
        } else if soundName == "defaultCritical" {
          content.sound = UNNotificationSound.defaultCritical
        } else {
          content.sound = UNNotificationSound(named: UNNotificationSoundName(rawValue: soundName))
        }
      }
    }

    var notificationAttachments: [UNNotificationAttachment] = []
    if let attachmentsArray = attachments {
      for attachmentObject in attachmentsArray {
        if let notificationAttachment: UNNotificationAttachment = attachment(attachmentObject) {
          notificationAttachments.append(notificationAttachment)
        }
      }
    }
    content.attachments = notificationAttachments
    if let interruptionLevel = interruptionLevel {
      content.interruptionLevel = deserializeInterruptionLevel(interruptionLevel)
    }

    return content
  }
}

// Notification permissions record

struct NotificationPermissionRecord: Record {
  @Field
  var allowAlert: Bool?
  @Field
  var allowBadge: Bool?
  @Field
  var allowSound: Bool?
  @Field
  var allowDisplayInCarPlay: Bool?
  @Field
  var allowCriticalAlerts: Bool?
  @Field
  var provideAppNotificationSettings: Bool?
  @Field
  var allowProvisional: Bool?

  func numberOfOptionsRequested() -> Int {
    return self.toDictionary(appContext: nil)
      .filter { $1 as? Bool ?? false == true }
      .count
  }

  func authorizationOptionValue() -> UNAuthorizationOptions {
    var options: UNAuthorizationOptions = []
    if self.allowAlert ?? false { options.insert(.alert) }
    if self.allowBadge ?? false { options.insert(.badge) }
    if self.allowSound ?? false { options.insert(.sound) }
    if self.allowDisplayInCarPlay ?? false { options.insert(.carPlay) }
    if self.allowCriticalAlerts ?? false { options.insert(.criticalAlert) }
    if self.provideAppNotificationSettings ?? false { options.insert(.providesAppNotificationSettings) }
    if self.allowProvisional ?? false { options.insert(.provisional) }
    return options
  }
}

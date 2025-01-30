//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore

// MARK: - NotificationBuilder record definitions

protocol TriggerRecord: Record {
  func toUNNotificationTrigger() throws -> UNNotificationTrigger?
}

struct CalendarTriggerRecord: TriggerRecord {
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

  func dateComponentsFrom(_ calendarTrigger: CalendarTriggerRecord) -> DateComponents {
    var dateComponents = DateComponents()
    // TODO: Verify that DoW matches JS getDay()
    dateComponents.calendar = Calendar.init(identifier: .iso8601)
    if let timeZone = calendarTrigger.timezone {
      dateComponents.timeZone = TimeZone(identifier: timeZone)
    }
    dateComponentsMatchMap.keys.forEach { key in
      let calendarComponent = dateComponentsMatchMap[key] ?? .day
      if let value = calendarTrigger.toDictionary()[key] as? Int {
        dateComponents.setValue(value, for: calendarComponent)
      }
    }
    return dateComponents
  }

  func toUNNotificationTrigger() throws -> UNNotificationTrigger? {
    var trigger: UNNotificationTrigger?
    try EXUtilities.catchException {
      let dateComponents: DateComponents = dateComponentsFrom(self)
      let repeats = self.repeats ?? false
      trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: repeats)
    }
    return trigger
  }
}

struct TimeIntervalTriggerRecord: TriggerRecord {
  @Field
  var seconds: TimeInterval
  @Field
  var repeats: Bool

  func toUNNotificationTrigger() throws -> UNNotificationTrigger? {
    var trigger: UNNotificationTrigger?
    try EXUtilities.catchException {
      trigger = UNTimeIntervalNotificationTrigger(timeInterval: self.seconds, repeats: self.repeats)
    }
    return trigger
  }
}

struct DateTriggerRecord: TriggerRecord {
  @Field
  var timestamp: TimeInterval

  func toUNNotificationTrigger() throws -> UNNotificationTrigger? {
    let timestamp: Int = Int(self.timestamp / 1000)
    let date: Date = Date(timeIntervalSince1970: TimeInterval(timestamp))
    var trigger: UNNotificationTrigger?
    try EXUtilities.catchException {
      trigger = UNTimeIntervalNotificationTrigger(timeInterval: date.timeIntervalSinceNow, repeats: false)
    }
    return trigger
  }
}

struct DailyTriggerRecord: TriggerRecord {
  @Field
  var hour: Int
  @Field
  var minute: Int

  func toUNNotificationTrigger() throws -> UNNotificationTrigger? {
    let dateComponents: DateComponents = DateComponents(hour: self.hour, minute: self.minute)
    var trigger: UNNotificationTrigger?
    try EXUtilities.catchException {
      trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
    }
    return trigger
  }
}

struct WeeklyTriggerRecord: TriggerRecord {
  @Field
  var weekday: Int
  @Field
  var hour: Int
  @Field
  var minute: Int

  func toUNNotificationTrigger() throws -> UNNotificationTrigger? {
    let dateComponents: DateComponents = DateComponents(hour: self.hour, minute: self.minute, weekday: self.weekday)
    var trigger: UNNotificationTrigger?
    try EXUtilities.catchException {
      trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
    }
    return trigger  }
}

struct MonthlyTriggerRecord: TriggerRecord {
  @Field
  var day: Int
  @Field
  var hour: Int
  @Field
  var minute: Int

  func toUNNotificationTrigger() throws -> UNNotificationTrigger? {
    let dateComponents: DateComponents = DateComponents(day: self.day, hour: self.hour, minute: self.minute)
    var trigger: UNNotificationTrigger?
    try EXUtilities.catchException {
      trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
    }
    return trigger
  }
}

struct YearlyTriggerRecord: TriggerRecord {
  @Field
  var month: Int
  @Field
  var day: Int
  @Field
  var hour: Int
  @Field
  var minute: Int

  func toUNNotificationTrigger() throws -> UNNotificationTrigger? {
    let dateComponents: DateComponents = DateComponents(
      month: self.month,
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

  func toUNTextInputNotificationAction(identifier: String) -> UNTextInputNotificationAction {
    return UNTextInputNotificationAction(
      identifier: identifier,
      title: title ?? "",
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

struct CategoryActionRecord: Record {
  init() {}

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
    if let textInput = textInput {
      return textInput.toUNTextInputNotificationAction(identifier: identifier)
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
    return UNNotificationAction(identifier: identifier, title: buttonTitle, options: notificationOptions)
  }
}

struct CategoryOptionsRecord: Record {
  init() {}

  // allowAnnouncement deprecated in iOS 15 and later
  /*
  @Field
  var allowAnnouncement: Bool?
   */
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
    // allowAnnouncement deprecated in iOS 15 and later
    // record.allowAnnouncement = category.options.contains(.allowAnnouncement)
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
    // allowAnnouncement deprecated in iOS 15 and later
    /*
    if allowAnnouncement as? Bool ?? false {
      options.insert(.allowAnnouncement)
    }
     */
    if showTitle == true {
      options.insert(.hiddenPreviewsShowTitle)
    }
    if showSubtitle == true {
      options.insert(.hiddenPreviewsShowSubtitle)
    }
    return options
  }
}

struct CategoryRecord: Record {
  init() {}

  @Field
  var identifier: String
  @Field
  var actions: [CategoryActionRecord]?
  @Field
  var options: CategoryOptionsRecord?

  init(_ category: UNNotificationCategory) {
    self.identifier = category.identifier
    self.actions = category.actions.map { action in
      return CategoryActionRecord(action)
    }
    self.options = CategoryOptionsRecord(category)
  }

  init(_ identifier: String, actions: [CategoryActionRecord], options: CategoryOptionsRecord?) {
    self.identifier = identifier
    self.actions = actions
    self.options = options
  }

  func toUNNotificationCategory() -> UNNotificationCategory {
    let intentIdentifiers: [String] = options?.intentIdentifiers as? [String] ?? []
    let previewPlaceholder: String? = options?.previewPlaceholder as? String
    let categorySummaryFormat: String? = options?.categorySummaryFormat as? String
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
  var userInfo: [String: Any]?
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

    if let userInfo = userInfo {
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

//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore

// MARK: - NotificationBuilder record definitions

struct CalendarTriggerRecord: Record {
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
}

struct TimeIntervalTriggerRecord: Record {
  @Field
  var seconds: TimeInterval
  @Field
  var repeats: Bool
}

struct DateTriggerRecord: Record {
  @Field
  var timestamp: TimeInterval
}

struct DailyTriggerRecord: Record {
  @Field
  var hour: Int
  @Field
  var minute: Int
}

struct WeeklyTriggerRecord: Record {
  @Field
  var weekday: Int
  @Field
  var hour: Int
  @Field
  var minute: Int
}

struct MonthlyTriggerRecord: Record {
  @Field
  var day: Int
  @Field
  var hour: Int
  @Field
  var minute: Int
}

struct YearlyTriggerRecord: Record {
  @Field
  var month: Int
  @Field
  var day: Int
  @Field
  var hour: Int
  @Field
  var minute: Int
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

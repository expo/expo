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

struct CategoryActionTextInputOptionsRecord: Record {
  @Field
  var placeholder: String?
  @Field
  var submitButtonTitle: String?
}

struct CategoryActionOptionsRecord: Record {
  @Field
  var isDestructive: Bool?
  @Field
  var isAuthenticationRequired: Bool?
  @Field
  var opensAppToForeground: Bool?
}

struct CategoryActionRecord: Record {
  @Field
  var identifier: String?
  @Field
  var buttonTitle: String?
  @Field
  var options: CategoryActionOptionsRecord?
  @Field
  var textInput: CategoryActionTextInputOptionsRecord?
}

struct CategoryOptionsRecord: Record {
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
}

struct CategoryRecord: Record {
  @Field
  var identifier: String?
  @Field
  var actions: [CategoryActionRecord]?
  @Field
  var options: CategoryOptionsRecord?
}

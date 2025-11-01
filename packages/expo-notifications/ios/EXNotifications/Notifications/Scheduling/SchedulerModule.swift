//  Copyright © 2024 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit
import MachO

// swiftlint:disable identifier_name
let notificationTriggerTypeKey = "type"
let notificationTriggerRepeatsKey = "repeats"

let timeIntervalNotificationTriggerType = "timeInterval"
let dailyNotificationTriggerType = "daily"
let weeklyNotificationTriggerType = "weekly"
let monthlyNotificationTriggerType = "monthly"
let yearlyNotificationTriggerType = "yearly"
let dateNotificationTriggerType = "date"
let calendarNotificationTriggerType = "calendar"

let calendarNotificationTriggerComponentsKey = "value"
let calendarNotificationTriggerTimezoneKey = "timezone"
// swiftlint:enable identifier_name

open class SchedulerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoNotificationScheduler")

    AsyncFunction("getAllScheduledNotificationsAsync") {
      let requests = await UNUserNotificationCenter.current().pendingNotificationRequests()
      return serializedNotificationRequests(requests)
    }

    AsyncFunction("cancelScheduledNotificationAsync") { (identifier: String) in
      cancelScheduledNotification(identifier)
    }

    AsyncFunction("cancelAllScheduledNotificationsAsync") { () in
      cancelAllScheduledNotifications()
    }

    AsyncFunction("scheduleNotificationAsync") { (identifier: String, content: NotificationContentRecord, triggerSpec: [String: Any]?, promise: Promise) in
      do {
        guard let request = try buildNotificationRequest(identifier: identifier, content: content, triggerInput: triggerSpec) else {
          promise.reject("ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE", "Failed to build notification request")
          return
        }
        UNUserNotificationCenter.current().add(request) { error in
          if let error = error {
            promise.reject("ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE", "Failed to schedule notification, \(error)")
          } else {
            promise.resolve(identifier)
          }
        }
      } catch {
        promise.reject("ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE", "Failed to schedule notification, \(error)")
      }
    }

    AsyncFunction("getNextTriggerDateAsync") { (triggerSpec: [String: Any], promise: Promise) in
      guard let appContext = appContext,
        let trigger = try? triggerFromParams(triggerSpec, appContext: appContext) else {
        promise.reject("ERR_NOTIFICATIONS_INVALID_CALENDAR_TRIGGER", "Invalid trigger specification")
        return
      }
      if trigger is UNCalendarNotificationTrigger {
        if let calendarTrigger = trigger as? UNCalendarNotificationTrigger,
          let nextTriggerDate = calendarTrigger.nextTriggerDate() {
          promise.resolve(nextTriggerDate.timeIntervalSince1970 * 1000)
        } else {
          promise.resolve(nil)
        }
        return
      }
      if trigger is UNTimeIntervalNotificationTrigger {
        if let timeIntervalTrigger = trigger as? UNTimeIntervalNotificationTrigger,
          let nextTriggerDate = timeIntervalTrigger.nextTriggerDate() {
          promise.resolve(nextTriggerDate.timeIntervalSince1970 * 1000)
        } else {
          promise.resolve(nil)
        }
        return
      }
      promise.reject("ERR_NOTIFICATIONS_INVALID_CALENDAR_TRIGGER", "It is not possible to get next trigger date for triggers other than calendar-based. Provided trigger resulted in \(type(of: trigger)) trigger.")
    }
  }

  func triggerFromParams(_ params: [String: Any]?, appContext: AppContext) throws -> UNNotificationTrigger? {
    guard let params = params, let triggerType = params[notificationTriggerTypeKey] as? String else {
      return nil
    }

    let record: TriggerRecord? = switch triggerType {
    case timeIntervalNotificationTriggerType:
      try TimeIntervalTriggerRecord(from: params, appContext: appContext)
    case dateNotificationTriggerType:
      try DateTriggerRecord(from: params, appContext: appContext)
    case dailyNotificationTriggerType:
      try DailyTriggerRecord(from: params, appContext: appContext)
    case weeklyNotificationTriggerType:
      try WeeklyTriggerRecord(from: params, appContext: appContext)
    case monthlyNotificationTriggerType:
      try MonthlyTriggerRecord(from: params, appContext: appContext)
    case yearlyNotificationTriggerType:
      try YearlyTriggerRecord(from: params, appContext: appContext)
    case calendarNotificationTriggerType:
      try CalendarTriggerRecord(from: params, appContext: appContext)
    default:
      nil
    }
    return try record?.toUNNotificationTrigger()
  }

  open func serializedNotificationRequests(_ requests: [UNNotificationRequest]) -> [NotificationRequestRecord] {
    return requests.map {
      NotificationRequestRecord(from: $0)
    }
  }

  open func buildNotificationRequest(
    identifier: String,
    content: NotificationContentRecord,
    triggerInput: [String: Any]?
  ) throws -> UNNotificationRequest? {
    guard let appContext = appContext else {
      return nil
    }
    return try UNNotificationRequest(
      identifier: identifier,
      content: content.toUNMutableNotificationContent(),
      trigger: triggerFromParams(triggerInput, appContext: appContext)
    )
  }

  open func cancelScheduledNotification(_ identifier: String) {
    UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [identifier])
  }

  open func cancelAllScheduledNotifications() {
    UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
  }
}

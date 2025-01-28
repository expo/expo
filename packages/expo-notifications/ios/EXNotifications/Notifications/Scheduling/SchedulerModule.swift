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

public class SchedulerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoNotificationScheduler")

    AsyncFunction("getAllScheduledNotificationsAsync") { (promise: Promise) in
      UNUserNotificationCenter.current().getPendingNotificationRequests { (requests: [UNNotificationRequest]) in
        var serializedRequests: [Any] = []
        requests.forEach {request in
          serializedRequests.append(EXNotificationSerializer.serializedNotificationRequest(request))
        }
        promise.resolve(serializedRequests)
      }
    }
    .runOnQueue(.main)

    AsyncFunction("cancelScheduledNotificationAsync") { (identifier: String) in
      UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [identifier])
    }

    AsyncFunction("cancelAllScheduledNotificationsAsync") { () in
      UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
    }

    AsyncFunction("scheduleNotificationAsync") { (identifier: String, notificationSpec: [String: Any], triggerSpec: [String: Any]?, promise: Promise) in
      do {
        guard let request = try buildNotificationRequest(identifier: identifier, contentInput: notificationSpec, triggerInput: triggerSpec) else {
          promise.reject("ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE", "Failed to build notification request")
          return
        }
        UNUserNotificationCenter.current().add(request) {error in
          if let error = error {
            promise.reject("ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE", "Failed to schedule notification, \(error)")
          } else {
            promise.resolve()
          }
          UNUserNotificationCenter.current().add(request) {error in
            if let error = error {
              promise.reject("ERR_NOTIFICATIONS_FAILED_TO_SCHEDULE", "Failed to schedule notification, \(error)")
            } else {
              promise.resolve(identifier)
            }
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
    guard let params = params else {
      return nil
    }

    guard let triggerType = params[notificationTriggerTypeKey] as? String else {
      return nil
    }

    switch triggerType {
    case timeIntervalNotificationTriggerType:
      let timeIntervalTrigger = try TimeIntervalTriggerRecord(from: params, appContext: appContext)
      var trigger: UNNotificationTrigger?
      try EXUtilities.catchException {
        trigger = UNTimeIntervalNotificationTrigger(timeInterval: timeIntervalTrigger.seconds, repeats: timeIntervalTrigger.repeats)
      }
      return trigger
    case dateNotificationTriggerType:
      let dateTrigger = try DateTriggerRecord(from: params, appContext: appContext)
      let timestamp: Int = Int(dateTrigger.timestamp / 1000)
      let date: Date = Date(timeIntervalSince1970: TimeInterval(timestamp))
      var trigger: UNNotificationTrigger?
      try EXUtilities.catchException {
        trigger = UNTimeIntervalNotificationTrigger(timeInterval: date.timeIntervalSinceNow, repeats: false)
      }
      return trigger
    case dailyNotificationTriggerType:
      let dailyTrigger = try DailyTriggerRecord(from: params, appContext: appContext)
      let dateComponents: DateComponents = DateComponents(hour: dailyTrigger.hour, minute: dailyTrigger.minute)
      var trigger: UNNotificationTrigger?
      try EXUtilities.catchException {
        trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
      }
      return trigger
    case weeklyNotificationTriggerType:
      let weeklyTrigger = try WeeklyTriggerRecord(from: params, appContext: appContext)
      let dateComponents: DateComponents = DateComponents(hour: weeklyTrigger.hour, minute: weeklyTrigger.minute, weekday: weeklyTrigger.weekday)
      var trigger: UNNotificationTrigger?
      try EXUtilities.catchException {
        trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
      }
      return trigger
    case monthlyNotificationTriggerType:
      let monthlyTrigger = try MonthlyTriggerRecord(from: params, appContext: appContext)
      let dateComponents: DateComponents = DateComponents(day: monthlyTrigger.day, hour: monthlyTrigger.hour, minute: monthlyTrigger.minute)
      var trigger: UNNotificationTrigger?
      try EXUtilities.catchException {
        trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
      }
      return trigger
    case yearlyNotificationTriggerType:
      let yearlyTrigger = try YearlyTriggerRecord(from: params, appContext: appContext)
      let dateComponents: DateComponents = DateComponents(
        month: yearlyTrigger.month,
        day: yearlyTrigger.day,
        hour: yearlyTrigger.hour,
        minute: yearlyTrigger.minute
      )
      var trigger: UNNotificationTrigger?
      try EXUtilities.catchException {
        trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: true)
      }
      return trigger
    case calendarNotificationTriggerType:
      let calendarTrigger = try CalendarTriggerRecord(from: params, appContext: appContext)
      let dateComponents: DateComponents = dateComponentsFrom(calendarTrigger) ?? DateComponents()
      let repeats = calendarTrigger.repeats ?? false
      var trigger: UNNotificationTrigger?
      try EXUtilities.catchException {
        trigger = UNCalendarNotificationTrigger(dateMatching: dateComponents, repeats: repeats)
      }
      return trigger
    default:
      return nil
    }
  }

  func dateComponentsFrom(_ calendarTrigger: CalendarTriggerRecord) -> DateComponents? {
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

  func serializeNotificationRequests(_ requests: [UNNotificationRequest]) -> [Any] {
    var serializedRequests: [[AnyHashable: Any]] = []
    requests.forEach {request in
      serializedRequests.append(EXNotificationSerializer .serializedNotificationRequest(request))
    }
    return serializedRequests
  }

  func buildNotificationRequest(
    identifier: String,
    contentInput: [String: Any],
    triggerInput: [String: Any]?
  ) throws -> UNNotificationRequest? {
    guard let appContext = appContext else {
      return nil
    }
    return try UNNotificationRequest(
      identifier: identifier,
      content: NotificationBuilder.content(contentInput, appContext: appContext),
      trigger: triggerFromParams(triggerInput, appContext: appContext)
    )
  }
}

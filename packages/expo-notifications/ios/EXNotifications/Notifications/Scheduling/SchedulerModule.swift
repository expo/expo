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

    AsyncFunction("scheduleNotificationAsync") { (identifier: String, notificationSpec: [String: Any], triggerSpec: [String: Any]?, promise: Promise) in
      do {
        guard let request = try buildNotificationRequest(identifier: identifier, contentInput: notificationSpec, triggerInput: triggerSpec) else {
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
    guard let params = params else {
      return nil
    }

    guard let triggerType = params[notificationTriggerTypeKey] as? String else {
      return nil
    }

    switch triggerType {
    case timeIntervalNotificationTriggerType:
      let timeIntervalTrigger = try TimeIntervalTriggerRecord(from: params, appContext: appContext)
      return try timeIntervalTrigger.toUNNotificationTrigger()
    case dateNotificationTriggerType:
      let dateTrigger = try DateTriggerRecord(from: params, appContext: appContext)
      return try dateTrigger.toUNNotificationTrigger()
    case dailyNotificationTriggerType:
      let dailyTrigger = try DailyTriggerRecord(from: params, appContext: appContext)
      return try dailyTrigger.toUNNotificationTrigger()
    case weeklyNotificationTriggerType:
      let weeklyTrigger = try WeeklyTriggerRecord(from: params, appContext: appContext)
      return try weeklyTrigger.toUNNotificationTrigger()
    case monthlyNotificationTriggerType:
      let monthlyTrigger = try MonthlyTriggerRecord(from: params, appContext: appContext)
      return try monthlyTrigger.toUNNotificationTrigger()
    case yearlyNotificationTriggerType:
      let yearlyTrigger = try YearlyTriggerRecord(from: params, appContext: appContext)
      return try yearlyTrigger.toUNNotificationTrigger()
    case calendarNotificationTriggerType:
      let calendarTrigger = try CalendarTriggerRecord(from: params, appContext: appContext)
      return try calendarTrigger.toUNNotificationTrigger()
    default:
      return nil
    }
  }

  open func serializedNotificationRequests(_ requests: [UNNotificationRequest]) -> [[String: Any]] {
    return requests.map {
      EXNotificationSerializer.serializedNotificationRequest($0)
    }
  }

  open func buildNotificationRequest(
    identifier: String,
    contentInput: [String: Any],
    triggerInput: [String: Any]?
  ) throws -> UNNotificationRequest? {
    guard let appContext = appContext else {
      return nil
    }
    let requestContentRecord = try NotificationRequestContentRecord(from: contentInput, appContext: appContext)
    return try UNNotificationRequest(
      identifier: identifier,
      content: requestContentRecord.toUNMutableNotificationContent(),
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

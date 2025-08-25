import Foundation
import ExpoModulesCore
import EventKit

internal class ExpoCalendarItem: SharedObject {
  internal var eventStore: EKEventStore {
    return CalendarModule.sharedEventStore
  }

  var calendarItem: EKCalendarItem? {
    fatalError("Subclasses must override calendarItem property")
  }

  func serializeAlarms() -> [[String: Any?]]? {
    guard let alarms = calendarItem?.alarms else {
      return nil
    }
    return serialize(alarms: alarms, with: dateFormatter)
  }

  // Mostly copied from CalendarModule.swift
  func serializeRecurrenceRule() -> RecurrenceRuleNext? {
    guard let rule = calendarItem?.recurrenceRules?.first else {
      return nil
    }
    let frequencyType = recurrenceToString(frequency: rule.frequency)
    var recurrenceRule: RecurrenceRuleNext = RecurrenceRuleNext(frequency: frequencyType)

    recurrenceRule.interval = rule.interval

    if let endDate = rule.recurrenceEnd?.endDate {
      recurrenceRule.endDate = dateFormatter.string(from: endDate)
    } else {
      recurrenceRule.endDate = nil
    }

    if let occurrenceCount = rule.recurrenceEnd?.occurrenceCount, occurrenceCount > 0 {
      recurrenceRule.occurrence = occurrenceCount
    } else {
      recurrenceRule.occurrence = nil
    }

    if let daysOfTheWeek = rule.daysOfTheWeek {
      recurrenceRule.daysOfTheWeek = daysOfTheWeek.map({ day in
        [
          "dayOfTheWeek": day.dayOfTheWeek.rawValue,
          "weekNumber": day.weekNumber
        ]
      })
    }

    if let daysOfTheMonth = rule.daysOfTheMonth {
      recurrenceRule.daysOfTheMonth = daysOfTheMonth.map { $0.intValue }
    }

    if let daysOfTheYear = rule.daysOfTheYear {
      recurrenceRule.daysOfTheYear = daysOfTheYear.map { $0.intValue }
    }

    if let monthsOfTheYear = rule.monthsOfTheYear {
      recurrenceRule.monthsOfTheYear = monthsOfTheYear.map { $0.intValue }
    }

    if let setPositions = rule.setPositions {
      recurrenceRule.setPositions = setPositions.map { $0.intValue }
    }

    return recurrenceRule
  }
}

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
    func serializeRecurrenceRule() -> [String: Any?]? {
        guard let rule = calendarItem?.recurrenceRules?.first else {
            return nil
        }
        let frequencyType = recurrenceToString(frequency: rule.frequency)
        var recurrenceRule: [String: Any?] = ["frequency": frequencyType]
        
        recurrenceRule["interval"] = rule.interval
        
        if let endDate = rule.recurrenceEnd?.endDate {
            recurrenceRule["endDate"] = dateFormatter.string(from: endDate)
        }
        
        recurrenceRule["occurrence"] = rule.recurrenceEnd?.occurrenceCount
        
        if let daysOfTheWeek = rule.daysOfTheWeek {
            recurrenceRule["daysOfTheWeek"] = daysOfTheWeek.map({ day in
                [
                    "dayOfTheWeek": day.dayOfTheWeek.rawValue,
                    "weekNumber": day.weekNumber
                ]
            })
        }
        
        if let daysOfTheMonth = rule.daysOfTheMonth {
            recurrenceRule["daysOfTheMonth"] = daysOfTheMonth
        }
        
        if let daysOfTheYear = rule.daysOfTheYear {
            recurrenceRule["daysOfTheYear"] = daysOfTheYear
        }
        
        if let monthsOfTheYear = rule.monthsOfTheYear {
            recurrenceRule["monthsOfTheYear"] = monthsOfTheYear
        }
        
        if let setPositions = rule.setPositions {
            recurrenceRule["setPositions"] = setPositions
        }
        
        return recurrenceRule
    }
}

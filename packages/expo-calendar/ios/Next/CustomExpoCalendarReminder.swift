import EventKit
import ExpoModulesCore
import Foundation

internal final class CustomExpoCalendarReminder: ExpoCalendarItem {
    var reminder: EKReminder?

    // Override the abstract property from ExpoCalendarItem
    override var calendarItem: EKCalendarItem? {
        return reminder
    }

    init(reminder: EKReminder) {
        self.reminder = reminder
    }

    override convenience init() {
        self.init(reminder: EKReminder(eventStore: CalendarModule.sharedEventStore))
    }

    func delete() throws {
        guard let reminder = self.reminder else {
            throw ItemNoLongerExistsException()
        }

        try eventStore.remove(reminder, commit: true)
        self.reminder = nil
    }

    public func initialize(reminderRecord: Reminder, calendar: EKCalendar? = nil) throws {
        guard let reminder else {
            throw ItemNoLongerExistsException()
        }

        if let calendar {
            reminder.calendar = calendar
        }

        reminder.title = reminderRecord.title
        reminder.location = reminderRecord.location
        reminder.notes = reminderRecord.notes

        let startDate = parse(date: reminderRecord.startDate)
        let dueDate = parse(date: reminderRecord.dueDate)
        let completionDate = parse(date: reminderRecord.completionDate)

        if let timeZone = reminderRecord.timeZone {
            if let eventTimeZone = TimeZone(identifier: timeZone) {
                reminder.timeZone = eventTimeZone
            } else {
                throw InvalidTimeZoneException(timeZone)
            }
        }

        if let alarms = reminderRecord.alarms {
            reminder.alarms = createCalendarEventAlarms(alarms: alarms)
        }

        if let recurrenceRule = reminderRecord.recurrenceRule {
            if let rule = createRecurrenceRule(rule: recurrenceRule) {
                reminder.recurrenceRules = [rule]
            }
        }

        if let url = reminderRecord.url {
            reminder.url = URL(string: url)
        }

        if let startDate {
            reminder.startDateComponents = createDateComponents(for: startDate)
        }

        if let dueDate {
            reminder.dueDateComponents = createDateComponents(for: dueDate)
        }

        if let completionDate {
            reminder.completionDate = completionDate
        }

        if let notes = reminderRecord.notes {
            reminder.notes = notes
        }

        if let isCompleted = reminderRecord.completed {
            reminder.isCompleted = isCompleted
        }

        reminder.title = reminderRecord.title
        reminder.location = reminderRecord.location
    }
}

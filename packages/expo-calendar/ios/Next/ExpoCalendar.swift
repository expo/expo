import Foundation
import ExpoModulesCore
import EventKit

internal final class ExpoCalendar: SharedObject {
    private var eventStore: EKEventStore {
        return CalendarModule.sharedEventStore
    }
    var calendar: EKCalendar?
    
    init(id: String) {
        super.init()
        self.calendar = eventStore.calendar(withIdentifier: id)
    }
    
    init(calendar: EKCalendar) {
        super.init()
        self.calendar = calendar
    }
    
    func listEvents(startDate: Date, endDate: Date) throws -> [ExpoCalendarEvent] {
        guard let calendar = self.calendar else {
            throw CalendarNoLongerExistsException()
        }
        let predicate = self.eventStore.predicateForEvents(withStart: startDate, end: endDate, calendars: [calendar])
        let events = self.eventStore.events(matching: predicate).sorted {
            $0.startDate.compare($1.startDate) == .orderedAscending
        }
        let customEvents = events.map { ExpoCalendarEvent(event: $0) }
        return customEvents
    }
    
    func listReminders(startDate: Date, endDate: Date, status: String?, promise: Promise) {
        guard let calendar = self.calendar else {
            promise.reject(CalendarNoLongerExistsException())
            return
        }
        //   try checkRemindersPermissions()
        let reminderCalendars: [EKCalendar] = [calendar]
        
        do {
            let predicate = try createPredicate(for: reminderCalendars, start: startDate, end: endDate, status: status)
            
            eventStore.fetchReminders(matching: predicate) { [promise] reminders in
                if let reminders {
                    promise.resolve(reminders.map { ExpoCalendarReminder(reminder: $0) })
                } else {
                    promise.resolve([])
                }
            }
        } catch {
            promise.reject(error)
        }
    }
    
    func update(calendarRecord: CalendarRecord) throws {
        guard let calendar = self.calendar else {
            throw CalendarNoLongerExistsException()
        }
        
        if calendar.isImmutable == true {
            throw CalendarNotSavedException(calendarRecord.title)
        }
        
        calendar.title = calendarRecord.title
        calendar.cgColor = EXUtilities.uiColor(calendarRecord.color)?.cgColor
        
        try eventStore.saveCalendar(calendar, commit: true)
    }
    
    func delete() throws {
        guard let calendar = self.calendar else {
            throw CalendarNoLongerExistsException()
        }
        try eventStore.removeCalendar(calendar, commit: true)
        self.calendar = nil
    }
    
    private func createPredicate(for calendars: [EKCalendar], start startDate: Date?, end endDate: Date?, status: String?) throws -> NSPredicate {
        guard let status else {
            return eventStore.predicateForReminders(in: calendars)
        }
        switch status {
        case "incomplete":
            return eventStore.predicateForIncompleteReminders(
                withDueDateStarting: startDate,
                ending: endDate,
                calendars: calendars
            )
        case "completed":
            return eventStore.predicateForCompletedReminders(
                withCompletionDateStarting: startDate,
                ending: endDate,
                calendars: calendars
            )
        default:
            throw InvalidStatusExceptions(status)
        }
    }
}

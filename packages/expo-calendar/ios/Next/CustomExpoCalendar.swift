import Foundation
import ExpoModulesCore
import EventKit

internal final class CustomExpoCalendar: SharedObject {
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
    
    func listEvents(startDate: Date, endDate: Date) throws -> [CustomExpoCalendarEvent] {
        guard let calendar = self.calendar else {
            throw CalendarNoLongerExistsException()
        }
        let predicate = self.eventStore.predicateForEvents(withStart: startDate, end: endDate, calendars: [calendar])
        let events = self.eventStore.events(matching: predicate).sorted {
            $0.startDate.compare($1.startDate) == .orderedAscending
        }
        let customEvents = events.map { CustomExpoCalendarEvent(event: $0) }
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
                    promise.resolve(reminders.map { CustomExpoCalendarReminder(reminder: $0) })
                } else {
                    promise.resolve([])
                }
            }
        } catch {
            promise.reject(error)
        }
    }
    
    func getEvent(from event: Event) throws -> EKEvent {
        let calendarEvent = EKEvent(eventStore: eventStore)
        calendarEvent.calendar = self.calendar
        calendarEvent.title = event.title
        calendarEvent.location = event.location
        calendarEvent.notes = event.notes
        return calendarEvent
    }
    
    // TODO: Clean up, copied from CalendarModule
    func initializeEvent(calendarEvent: EKEvent, event: Event) throws {
        if let timeZone = event.timeZone {
            if let tz = TimeZone(identifier: timeZone) {
                calendarEvent.timeZone = tz
            } else {
                throw InvalidTimeZoneException(timeZone)
            }
        }
        
        calendarEvent.alarms = createCalendarEventAlarms(alarms: event.alarms)
        if let rule = event.recurrenceRule {
            let newRule = createRecurrenceRule(rule: rule)
            if let newRule {
                calendarEvent.recurrenceRules = [newRule]
            }
        }
        
        if let url = event.url {
            calendarEvent.url = URL(string: url)
        }
        
        if let startDate = event.startDate {
            calendarEvent.startDate = parse(date: startDate)
        }
        if let endDate = event.endDate {
            calendarEvent.endDate = parse(date: endDate)
        }
        
        if let calendarId = event.calendarId {
            guard let calendar = eventStore.calendar(withIdentifier: calendarId) else {
                throw CalendarIdNotFoundException(calendarId)
            }
            calendarEvent.calendar = calendar
        }
        
        calendarEvent.title = event.title
        calendarEvent.location = event.location
        calendarEvent.notes = event.notes
        calendarEvent.isAllDay = event.allDay
        calendarEvent.availability = getAvailability(availability: event.availability)
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

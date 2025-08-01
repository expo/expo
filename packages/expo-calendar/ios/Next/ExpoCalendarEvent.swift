import Foundation
import ExpoModulesCore
import EventKit

internal final class ExpoCalendarEvent: ExpoCalendarItem {
    var event: EKEvent?
    
    override var calendarItem: EKCalendarItem? {
        return event
    }
    
    init(event: EKEvent) {
        self.event = event
    }
    
    convenience init(eventRecord: Event) throws {
        let sharedEventStore = CalendarModule.sharedEventStore
        
        guard let calendarId = eventRecord.calendarId else {
            throw CalendarIdRequiredException()
        }
        
        guard let calendar = sharedEventStore.calendar(withIdentifier: calendarId) else {
            throw CalendarIdNotFoundException(calendarId)
        }
        
        try self.init(calendar: calendar, eventRecord: eventRecord)
    }

    convenience init(calendar: EKCalendar, eventRecord: Event) throws {
        let sharedEventStore = CalendarModule.sharedEventStore
        
        if calendar.allowedEntityTypes.isDisjoint(with: [.event]) {
            throw InvalidCalendarTypeException((calendar.calendarIdentifier, "event"))
        }
        
        let calendarEvent = EKEvent(eventStore: sharedEventStore)
        calendarEvent.calendar = calendar
        calendarEvent.title = eventRecord.title
        calendarEvent.location = eventRecord.location
        calendarEvent.notes = eventRecord.notes
        
        self.init(event: calendarEvent)
    }
    
    func update(eventRecord: Event, options: RecurringEventOptions?) throws {
        guard let calendarEvent = self.event else {
            throw EventNotFoundException("EKevent not found")
        }
        
        try self.initialize(eventRecord: eventRecord)
        
        let span: EKSpan = options?.futureEvents == true ? .futureEvents : .thisEvent
        
        try eventStore.save(calendarEvent, span: span, commit: true)
    }
    
    func delete(options: RecurringEventOptions) throws {
        guard let id = self.event?.calendarItemIdentifier else {
            throw ItemNoLongerExistsException()
        }
        
        let span: EKSpan = options.futureEvents == true ? .futureEvents : .thisEvent
        let instanceStartDate = parse(date: options.instanceStartDate)
        
        guard let calendarEvent = getEvent(with: id, startDate: instanceStartDate) else {
            return
        }
        
        try eventStore.remove(calendarEvent, span: span)
        self.event = nil
    }
    
    public func initialize(eventRecord: Event) throws {
        guard let event = self.event else {
            throw EventNotFoundException("EKevent not found")
        }
        
        if let timeZone = eventRecord.timeZone {
            if let tz = TimeZone(identifier: timeZone) {
                event.timeZone = tz
            } else {
                throw InvalidTimeZoneException(timeZone)
            }
        }
        
        event.alarms = createCalendarEventAlarms(alarms: eventRecord.alarms)
        if let rule = eventRecord.recurrenceRule {
            let newRule = createRecurrenceRule(rule: rule)
            if let newRule {
                event.recurrenceRules = [newRule]
            }
        }
        
        if let url = eventRecord.url {
            event.url = URL(string: url)
        }
        
        if let startDate = eventRecord.startDate {
            event.startDate = parse(date: startDate)
        }
        if let endDate = eventRecord.endDate {
            event.endDate = parse(date: endDate)
        }
        
        if let calendarId = eventRecord.calendarId {
            guard let calendar = eventStore.calendar(withIdentifier: calendarId) else {
                throw CalendarIdNotFoundException(calendarId)
            }
            event.calendar = calendar
        }
        
        event.title = eventRecord.title
        event.location = eventRecord.location
        event.notes = eventRecord.notes
        event.isAllDay = eventRecord.allDay
        event.availability = getAvailability(availability: eventRecord.availability)
    }
    
    // TODO: Copied from CalendarModule
    // @deprecated, use implementation without `id` param
    private func getEvent(with id: String, startDate: Date?) -> EKEvent? {
        guard let firstEvent = eventStore.calendarItem(withIdentifier: id) as? EKEvent else {
            return nil
        }
        
        guard let startDate else {
            return firstEvent
        }
        
        guard let firstEventStart = firstEvent.startDate, firstEventStart.compare(startDate) == .orderedSame else {
            return firstEvent
        }
        
        let endDate = startDate.addingTimeInterval(2_592_000)
        let events = eventStore.events(
            matching: eventStore.predicateForEvents(withStart: startDate, end: endDate, calendars: [firstEvent.calendar])
        )
        
        for event in events {
            if event.calendarItemIdentifier != id {
                break
            }
            if let eventStart = event.startDate, eventStart.compare(startDate) == .orderedSame {
                return event
            }
        }
        return nil
    }
    
    // Custom getEvent to get exact instance, it is replacing the above old implementation
    internal func getEvent(startDate: Date?) -> EKEvent? {
        guard let firstEvent = self.event else {
            return nil
        }
        
        guard let id = firstEvent.eventIdentifier else {
            return nil
        }
        
        guard let startDate else {
            return firstEvent
        }
        
        guard let firstEventStart = firstEvent.startDate, firstEventStart.compare(startDate) == .orderedSame else {
            return firstEvent
        }
        
        let endDate = startDate.addingTimeInterval(2_592_000)
        let events = eventStore.events(
            matching: eventStore.predicateForEvents(withStart: startDate, end: endDate, calendars: [firstEvent.calendar])
        )
        
        for event in events {
            if event.calendarItemIdentifier != id {
                break
            }
            if let eventStart = event.startDate, eventStart.compare(startDate) == .orderedSame {
                return event
            }
        }
        return nil
    }
}

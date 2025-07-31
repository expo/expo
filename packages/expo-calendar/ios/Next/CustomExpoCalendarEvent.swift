import Foundation
import ExpoModulesCore
import EventKit

internal final class CustomExpoCalendarEvent: ExpoCalendarItem {
    var event: EKEvent?
    
    // Override the abstract property from ExpoCalendarItem
    override var calendarItem: EKCalendarItem? {
        return event
    }
    
    init(event: EKEvent) {
        self.event = event
    }
    
    init(eventRecord: Event) throws {
        let sharedEventStore = CalendarModule.sharedEventStore
        //        if let id = eventRecord.id {
        //            guard let event = fromId(with: id, startDate: parse(date: eventRecord.instanceStartDate)) else {
        //                throw EventNotFoundException(id)
        //            }
        //            return event
        //        }
        
        guard let calendarId = eventRecord.calendarId else {
            throw CalendarIdRequiredException()
        }
        
        guard let calendar = sharedEventStore.calendar(withIdentifier: calendarId) else {
            throw CalendarIdNotFoundException(calendarId)
        }
        
        if calendar.allowedEntityTypes.isDisjoint(with: [.event]) {
            throw InvalidCalendarTypeException((calendarId, "event"))
        }
        
        let calendarEvent = EKEvent(eventStore: sharedEventStore)
        calendarEvent.calendar = calendar
        calendarEvent.title = eventRecord.title
        calendarEvent.location = eventRecord.location
        calendarEvent.notes = eventRecord.notes
        
        self.event = calendarEvent
    }
    
    init(with: String, startDate: Date) {
        
    }
    
    func update(eventRecord: Event, options: RecurringEventOptions) throws {
        //        try checkCalendarPermissions()
        let expoEvent = try CustomExpoCalendarEvent(eventRecord: eventRecord)
        
        guard let calendarEvent = expoEvent.event else {
            throw EventNotFoundException("EKevent not found")
        }
        
        try expoEvent.initialize(eventRecord: eventRecord)
        
        let span: EKSpan = options.futureEvents == true ? .futureEvents : .thisEvent
        
        try eventStore.save(calendarEvent, span: span, commit: true)
    }
    
    func delete(options: RecurringEventOptions) throws {
        guard let id = self.event?.calendarItemIdentifier else {
            throw EventIdRequiredException()
        }
        print("ID: \(id)")
        throw NotImplementedYetException()
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
}

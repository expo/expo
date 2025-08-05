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

       try self.initialize(event: calendarEvent, eventRecord: eventRecord)

        let span: EKSpan = options?.futureEvents == true ? .futureEvents : .thisEvent

        try eventStore.save(calendarEvent, span: span, commit: true)
    }

    func delete(options: RecurringEventOptions) throws {
        guard let id = self.event?.calendarItemIdentifier else {
            throw ItemNoLongerExistsException()
        }

        let span: EKSpan = options.futureEvents == true ? .futureEvents : .thisEvent
        let instanceStartDate = parse(date: options.instanceStartDate)

        guard let calendarEvent = getOccurrence(startDate: instanceStartDate) else {
            return
        }

        try eventStore.remove(calendarEvent, span: span)
        self.event = nil
    }

    func initialize(eventRecord: Event) throws {
        guard let event = self.event else {
            throw EventNotFoundException("EKevent not found")
        }
        try initialize(event: event, eventRecord: eventRecord)
    }

    func initialize(event: EKEvent, eventRecord: Event) throws {
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

        if let title = eventRecord.title {
            event.title = title
        }

        if let location = eventRecord.location {
            event.location = location
        }

        if let notes = eventRecord.notes {
            event.notes = notes
        }

        if let allDay = eventRecord.allDay {
            event.isAllDay = allDay
        }

        if let availability = eventRecord.availability {
            event.availability = getAvailability(availability: availability)
        }
    }

    func getAttendees(options: RecurringEventOptions?) throws -> [ExpoCalendarAttendee]? {
        let occurence = try getOccurrence(options: options)

        guard let occurence, let attendees = occurence.attendees else {
            return []
        }

        return attendees.map { ExpoCalendarAttendee(attendee: $0) }
    }

    func getOccurrence(options: RecurringEventOptions?) throws -> EKEvent? {
        let instanceStartDate = parse(date: options?.instanceStartDate)
        guard let event = getOccurrence(startDate: instanceStartDate) else {
            throw EventNotFoundException(options?.instanceStartDate ?? "")
        }
        return event
    }

    private func getOccurrence(with id: String, startDate: Date?) -> EKEvent? {
        guard let firstEvent = eventStore.calendarItem(withIdentifier: id) as? EKEvent else {
            return nil
        }

        return getOccurrence(firstEvent: firstEvent, startDate: startDate)
    }

    internal func getOccurrence(firstEvent: EKEvent, startDate: Date?) -> EKEvent? {
        guard let startDate else {
            return firstEvent
        }

        if let firstEventStart = firstEvent.startDate, firstEventStart.compare(startDate) == .orderedSame {
            return firstEvent
        }

        let endDate = startDate.addingTimeInterval(2_592_000)
        let events = eventStore.events(
            matching: eventStore.predicateForEvents(withStart: startDate, end: endDate, calendars: [firstEvent.calendar])
        )

        for event in events {
            if let eventStart = event.startDate, eventStart.compare(startDate) == .orderedSame {
                return event
            }
        }
        return nil
    }

    internal func getOccurrence(startDate: Date?) -> EKEvent? {
        guard let firstEvent = self.event else {
            return nil
        }

        return getOccurrence(firstEvent: firstEvent, startDate: startDate)
    }
}

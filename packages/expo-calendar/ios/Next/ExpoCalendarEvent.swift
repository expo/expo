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

  convenience init(eventRecord: EventNext) throws {
    let sharedEventStore = CalendarModule.sharedEventStore

    guard let calendarId = eventRecord.calendarId else {
      throw CalendarIdRequiredException()
    }

    guard let calendar = sharedEventStore.calendar(withIdentifier: calendarId) else {
      throw CalendarIdNotFoundException(calendarId)
    }

    try self.init(calendar: calendar, eventRecord: eventRecord)
  }

  convenience init(calendar: EKCalendar, eventRecord: EventNext) throws {
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

  func update(eventRecord: EventNext, options: RecurringEventOptions?, nullableFields: [String]? = nil) throws {
    guard let calendarEvent = self.event else {
      throw ItemNoLongerExistsException()
    }

    try self.initialize(event: calendarEvent, eventRecord: eventRecord, nullableFields: nullableFields)

    let span: EKSpan = options?.futureEvents == true ? .futureEvents : .thisEvent

    try eventStore.save(calendarEvent, span: span, commit: true)
  }

  func delete(options: RecurringEventOptions) throws {
    if self.event?.calendarItemIdentifier == nil {
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

  func initialize(eventRecord: EventNext, nullableFields: [String]? = nil) throws {
    guard let event = self.event else {
      throw EventNotFoundException("EKevent not found")
    }
    try initialize(event: event, eventRecord: eventRecord, nullableFields: nullableFields)
  }

  // swiftlint:disable:next cyclomatic_complexity
  func initialize(event: EKEvent, eventRecord: EventNext, nullableFields: [String]? = nil) throws {
    let nullableSet = Set(nullableFields ?? [])

    if nullableSet.contains("timeZone") {
      event.timeZone = nil
    } else if let timeZone = eventRecord.timeZone {
      if let tz = TimeZone(identifier: timeZone) {
        event.timeZone = tz
      } else {
        throw InvalidTimeZoneException(timeZone)
      }
    }

    if nullableSet.contains("alarms") {
      event.alarms = []
    } else if let alarms = eventRecord.alarms {
      event.alarms = createCalendarEventAlarms(alarms: alarms)
    }

    if nullableSet.contains("recurrenceRule") {
      event.recurrenceRules = nil
    } else if let rule = eventRecord.recurrenceRule {
      let newRule = createRecurrenceRule(rule: rule)
      if let newRule {
        event.recurrenceRules = [newRule]
      }
    }

    if nullableSet.contains("url") {
      event.url = nil
    } else if let url = eventRecord.url {
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

    if nullableSet.contains("location") {
      event.location = nil
    } else if let location = eventRecord.location {
      event.location = location
    }

    if nullableSet.contains("notes") {
      event.notes = nil
    } else if let notes = eventRecord.notes {
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
    let occurrence = try getOccurrence(options: options)

    guard let occurrence, let attendees = occurrence.attendees else {
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

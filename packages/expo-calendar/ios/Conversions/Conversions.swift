import ExpoModulesCore
import EventKit

let dateFormatter: DateFormatter = {
  let df = DateFormatter()
  df.timeZone = TimeZone(identifier: "UTC")
  df.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ"
  df.locale = Locale(identifier: "en_US_POSIX")
  return df
}()

func entity(type: EKEntityMask) -> String? {
  let allowsEvents = type.contains(.event)
  let allowsReminders = type.contains(.reminder)

  if allowsEvents && allowsReminders {
    return "both"
  }
  if allowsReminders {
    return "reminder"
  }
  if allowsEvents {
    return "event"
  }

  return nil
}

func calendarSupportedAvailabilities(fromMask types: EKCalendarEventAvailabilityMask) -> [String] {
  var availabilitiesStrings = [String]()

  if types.contains(.busy) {
    availabilitiesStrings.append("busy")
  }
  if types.contains(.free) {
    availabilitiesStrings.append("free")
  }
  if types.contains(.tentative) {
    availabilitiesStrings.append("tentative")
  }
  if types.contains(.unavailable) {
    availabilitiesStrings.append("unavailable")
  }

  return availabilitiesStrings
}

func serialize(ekSource: EKSource) -> [String: Any?] {
  return [
    "id": ekSource.sourceIdentifier,
    "type": sourceToString(type: ekSource.sourceType),
    "name": ekSource.title
  ]
}

func serializeCalendars(calendars: [EKCalendar]) -> [[String: Any?]] {
  calendars.map { calendar in
    serializeCalendar(calendar: calendar)
  }
}

func serializeCalendar(calendar: EKCalendar) -> [String: Any?] {
  return [
    "id": calendar.calendarIdentifier,
    "title": calendar.title,
    "source": serialize(ekSource: calendar.source),
    "entityType": entity(type: calendar.allowedEntityTypes),
    "color": calendar.cgColor != nil ? EXUtilities.hexString(with: calendar.cgColor) : nil,
    "type": calendarTypeToString(type: calendar.type, source: calendar.source.sourceType),
    "allowsModifications": calendar.allowsContentModifications,
    "allowedAvailabilities": calendarSupportedAvailabilities(fromMask: calendar.supportedEventAvailabilities)
  ]
}

func serializeCalendar(events: [EKEvent]) -> [[String: Any?]] {
  events.map { event in
    serializeCalendar(event: event)
  }
}

func serializeCalendar(event: EKEvent) -> [String: Any?] {
  var serializedCalendarEvent = serializeCalendar(item: event, with: dateFormatter)

  if let startDate = event.startDate {
    print("StartDate \(dateFormatter.string(from: startDate))")
    serializedCalendarEvent["startDate"] = dateFormatter.string(from: startDate)
  }

  if let endDate = event.endDate {
    serializedCalendarEvent["endDate"] = dateFormatter.string(from: endDate)
  }

  if let occurrenceDate = event.occurrenceDate {
    serializedCalendarEvent["originalStartDate"] = dateFormatter.string(from: occurrenceDate)
  }

  serializedCalendarEvent["isDetached"] = event.isDetached
  serializedCalendarEvent["allDay"] = event.isAllDay
  serializedCalendarEvent["availability"] = eventAvailabilityToString(event.availability)
  serializedCalendarEvent["status"] = eventStatusToString(event.status)
  if let organizer = event.organizer {
    serializedCalendarEvent["organizer"] = serialize(attendee: organizer)
  }
  return serializedCalendarEvent
}

func serializeCalendar(item: EKCalendarItem, with formatter: DateFormatter) -> [String: Any?] {
  var serailizedItem = [String: Any?]()

  serailizedItem["id"] = item.calendarItemIdentifier
  serailizedItem["calendarId"] = item.calendar.calendarIdentifier
  if let title = item.title {
    serailizedItem["title"] = title
  }

  if let location = item.location {
    serailizedItem["location"] = location
  }

  if let creationDate = item.creationDate {
    serailizedItem["creationDate"] = formatter.string(from: creationDate)
  }

  if let lastModifiedDate = item.lastModifiedDate {
    serailizedItem["lastModifiedDate"] = formatter.string(from: lastModifiedDate)
  }

  serailizedItem["timeZone"] = item.timeZone?.localizedName(for: .shortStandard, locale: .current)
  serailizedItem["url"] = item.url?.absoluteString.removingPercentEncoding
  serailizedItem["notes"] = item.notes
  if let alarms = item.alarms {
    serailizedItem["alarms"] = serialize(alarms: alarms, with: formatter)
  }

  if let rule = item.recurrenceRules?.first {
    let frequencyType = recurrenceToString(frequency: rule.frequency)
    var recurrenceRule: [String: Any?] = ["frequency": frequencyType]

    recurrenceRule["interval"] = rule.interval

    if let endDate = rule.recurrenceEnd?.endDate {
      recurrenceRule["endDate"] = formatter.string(from: endDate)
    }

    recurrenceRule["occurrence"] = rule.recurrenceEnd?.occurrenceCount

    if let daysOfTheWeek = rule.daysOfTheWeek {
      recurrenceRule["daysOfTheWeek"] = daysOfTheWeek.map({ day in
        [
          "dayOfTheWeek": day.dayOfTheWeek,
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

    serailizedItem["recurrenceRule"] = recurrenceRule
  }
  return serailizedItem
}

func serialize(reminders: [EKReminder]) -> [[String: Any?]] {
  reminders.map { reminder in
    serialize(reminder)
  }
}

func serialize(_ reminder: EKReminder) -> [String: Any?] {
  let currentCalendar = Calendar.current
  var serializedReminder = serializeCalendar(item: reminder, with: dateFormatter)

  if let startDateComponents = reminder.startDateComponents {
    if let startDate = currentCalendar.date(from: startDateComponents) {
      serializedReminder["startDate"] = dateFormatter.string(from: startDate)
    }
  }

  if let dueDateComponents = reminder.dueDateComponents {
    if let dueDate = currentCalendar.date(from: dueDateComponents) {
      serializedReminder["dueDate"] = dateFormatter.string(from: dueDate)
    }
  }

  serializedReminder["completed"] = reminder.isCompleted

  if let completionDate = reminder.completionDate {
    serializedReminder["completionDate"] = dateFormatter.string(from: completionDate)
  }

  return serializedReminder
}

func serialize(attendees: [EKParticipant]) -> [[String: Any?]] {
  attendees.map { attendee in
    serialize(attendee: attendee)
  }
}

func serialize(attendee: EKParticipant) -> [String: Any?] {
  var serializedAttendee = [String: Any?]()

  serializedAttendee["isCurrentUser"] = attendee.isCurrentUser
  if let name = attendee.name {
    serializedAttendee["name"] = name
  }

  serializedAttendee["role"] = participantToString(role: attendee.participantRole)
  serializedAttendee["status"] = participantStatusToString(status: attendee.participantStatus)
  serializedAttendee["type"] = participantTypeToString(type: attendee.participantType)
  serializedAttendee["url"] = attendee.url.absoluteString.removingPercentEncoding

  return serializedAttendee
}

func serialize(alarms: [EKAlarm], with formatter: DateFormatter) -> [[String: Any?]] {
  alarms.map { alarm in
    var serializedAlarm = [String: Any?]()
    if let absoluteDate = alarm.absoluteDate {
      serializedAlarm["absoluteDate"] = formatter.string(from: absoluteDate)
    }

    serializedAlarm["relativeOffset"] = alarm.relativeOffset / 60.0

    if let structuredLocation = alarm.structuredLocation {
      var proximity: String?
      switch alarm.proximity {
      case .enter:
        proximity = "enter"
      case .leave:
        proximity = "leave"
      default:
        proximity = "None"
      }
      serializedAlarm["structuredLocation"] = [
        "title": structuredLocation.title,
        "proximity": proximity,
        "radius": structuredLocation.radius,
        "coord": [
          "latitude": structuredLocation.geoLocation?.coordinate.latitude,
          "longitude": structuredLocation.geoLocation?.coordinate.longitude
        ]
      ]
    }

    return serializedAlarm
  }
}

import ExpoModulesCore
import EventKit

func eventAvailability(_ availability: EKEventAvailability) -> String {
  switch availability {
  case .notSupported:
    return "notSupported"
  case .busy:
    return "busy"
  case .free:
    return "free"
  case .tentative:
    return "tentative"
  case .unavailable:
    return "unavailable"
  }
}

func eventStatus(_ status: EKEventStatus) -> String {
  switch status {
  case .none:
    return "none"
  case .confirmed:
    return "confirmed"
  case .tentative:
    return "tentative"
  case .canceled:
    return "cancelled"
  }
}

func source(type: EKSourceType) -> String {
  switch type {
  case .local:
    return "local"
  case .exchange:
    return "exchange"
  case .calDAV:
    return "caldav"
  case .mobileMe:
    return "mobileme"
  case .subscribed:
    return "subscribed"
  case .birthdays:
    return "birthdays"
  }
}

func participant(role: EKParticipantRole) -> String {
  switch role {
  case .unknown:
    return "unknown"
  case .required:
    return "required"
  case .optional:
    return "optional"
  case .chair:
    return "chair"
  case .nonParticipant:
    return "notParticipant"
  }
}

func participant(type: EKParticipantType) -> String {
  switch type {
  case .unknown:
    return "unknown"
  case .person:
    return "person"
  case .room:
    return "room"
  case .group:
    return "group"
  case .resource:
    return "resource"
  }
}

func participant(status: EKParticipantStatus) -> String {
  switch status {
  case .unknown:
    return "unknown"
  case .pending:
    return "pending"
  case .accepted:
    return "accepted"
  case .declined:
    return "declined"
  case .tentative:
    return "tentative"
  case .delegated:
    return "delegated"
  case .completed:
    return "completed"
  case .inProcess:
    return "inProcess"
  }
}

func recurrence(frequency: EKRecurrenceFrequency) -> String {
  switch frequency {
  case .daily:
    return "daily"
  case .weekly:
    return "weekly"
  case .monthly:
    return "monthly"
  case .yearly:
    return "yearly"
  }
}

func calendarType(type: EKCalendarType) -> String {
  switch type {
  case .local:
    return "local"
  case .calDAV:
    return "caldav"
  case .exchange:
    return "exchange"
  case .subscription:
    return "subscribed"
  case .birthday:
    return "birthdays"
  }
}

import ExpoModulesCore

internal class MissionPermissionsException: GenericException<String> {
  override var reason: String {
    "\(param) permission is required to do this operation"
  }
}

internal class DefaultCalendarNotFoundException: Exception {
  override var reason: String {
    "Could not find the default calendar"
  }
}

internal class CalendarNotSavedException: GenericException<String> {
  override var reason: String {
    "Calendar \(param) is immutable and cannot be modified"
  }
}

internal class EntityNotSupportedException: GenericException<String?> {
  override var reason: String {
    "Calendar entityType \(param) is not supported"
  }
}

internal class CalendarIdNotFoundException: GenericException<String> {
  override var reason: String {
    "Calendar with id \(param) could not be found"
  }
}

internal class EventNotFoundException: GenericException<String> {
  override var reason: String {
    "Event with id \(param) could not be found"
  }
}

internal class InvalidCalendarTypeException: GenericException<(String, String)> {
  override var reason: String {
    "Calendar with id \(param.0) is not of type `\(param.1)`"
  }
}

internal class MissingParameterException: Exception {
  override var reason: String {
    "`Calendar.getRemindersAsync` needs at least one calendar ID"
  }
}

internal class ReminderNotFoundException: GenericException<String> {
  override var reason: String {
    "Reminder with id \(param) could not be found"
  }
}

internal class InvalidCalendarEntityException: GenericException<String?> {
  override var reason: String {
    "Calendar entityType \(param) is not supported"
  }
}

internal class InvalidTimeZoneException: GenericException<String> {
  override var reason: String {
    "Invalid time zone: \(param)"
  }
}

internal class SourceNotFoundException: GenericException<String> {
  override var reason: String {
    "Source with id \(param) was not found"
  }
}

internal class PermissionsManagerNotFoundException: Exception {
  override var reason: String {
    "Permissions module not found. Are you sure that Expo modules are properly linked?"
  }
}

internal class InvalidDateFormatException: Exception {
  override var reason: String {
    "JSON String could not be interpreted as a date. Expected format: YYYY-MM-DD'T'HH:mm:ss.sssZ"
  }
}

internal class CalendarIdRequiredException: Exception {
  override var reason: String {
    "CalendarId is required"
  }
}

internal class EventIdRequiredException: Exception {
  override var reason: String {
    "Event Id is required"
  }
}

internal class InvalidStatusExceptions: GenericException<String> {
  override var reason: String {
    "`\(param)` is not a valid reminder status"
  }
}

internal class MissingCalendarPListValueException: GenericException<String> {
  override var reason: String {
    "This app is missing \(param), so calendar methods will fail. Add this key to your bundle's Info.plist"
  }
}

internal class MissingRemindersPListValueException: GenericException<String> {
  override var reason: String {
    "This app is missing \(param), so reminders methods will fail. Add this key to your bundle's Info.plist"
  }
}

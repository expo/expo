import ExpoModulesCore

final internal class MissionPermissionsException: GenericException<String> {
  override var reason: String {
    "\(param) permission is required to do this operation"
  }
}

final internal class DefaultCalendarNotFoundException: Exception {
  override var reason: String {
    "Could not find the default calendar"
  }
}

final internal class CalendarNotSavedException: GenericException<String> {
  override var reason: String {
    "Calendar \(param) is immutable and cannot be modified"
  }
}

final internal class EntityNotSupportedException: GenericException<String?> {
  override var reason: String {
    "Calendar entityType \(String(describing: param)) is not supported"
  }
}

final internal class CalendarIdNotFoundException: GenericException<String> {
  override var reason: String {
    "Calendar with id \(param) could not be found"
  }
}

final internal class EventNotFoundException: GenericException<String> {
  override var reason: String {
    "Event with id \(param) could not be found"
  }
}

final internal class InvalidCalendarTypeException: GenericException<(String, String)> {
  override var reason: String {
    "Calendar with id \(param.0) is not of type `\(param.1)`"
  }
}

final internal class MissingParameterException: GenericException<String?> {
  override var reason: String {
    guard let param else {
      return "Missing parameter"
    }
    return "Missing parameter: \(param)"
  }
}

final internal class ReminderNotFoundException: GenericException<String> {
  override var reason: String {
    "Reminder with id \(param) could not be found"
  }
}

final internal class ReminderNotCreatedException: GenericException<String> {
  override var reason: String {
    "Reminder \(param) could not be created"
  }
}

final internal class InvalidCalendarEntityException: GenericException<String?> {
  override var reason: String {
    "Calendar entityType \(String(describing: param)) is not supported"
  }
}

final internal class InvalidTimeZoneException: GenericException<String> {
  override var reason: String {
    "Invalid time zone: \(param)"
  }
}

final internal class SourceNotFoundException: GenericException<String> {
  override var reason: String {
    "Source with id \(param) was not found"
  }
}

final internal class PermissionsManagerNotFoundException: Exception {
  override var reason: String {
    "Permissions module not found. Are you sure that Expo modules are properly linked?"
  }
}

final internal class InvalidDateFormatException: Exception {
  override var reason: String {
    "JSON String could not be interpreted as a date. Expected format: YYYY-MM-DD'T'HH:mm:ss.sssZ"
  }
}

final internal class CalendarIdRequiredException: Exception {
  override var reason: String {
    "CalendarId is required"
  }
}

final internal class EventIdRequiredException: Exception {
  override var reason: String {
    "Event Id is required"
  }
}

final internal class InvalidStatusExceptions: GenericException<String> {
  override var reason: String {
    "`\(param)` is not a valid reminder status"
  }
}

final internal class MissingCalendarPListValueException: GenericException<String> {
  override var reason: String {
    "This app is missing \(param), so calendar methods will fail. Add this key to your bundle's Info.plist"
  }
}

final internal class MissingRemindersPListValueException: GenericException<String> {
  override var reason: String {
    "This app is missing \(param), so reminders methods will fail. Add this key to your bundle's Info.plist"
  }
}

final internal class EventDialogInProgressException: Exception {
  override var reason: String {
    "Different calendar dialog is already being presented. Await its result before presenting another."
  }
}

final internal class CalendarNoLongerExistsException: Exception {
  override var reason: String {
    "The specified calendar no longer exists."
  }
}

final internal class ItemNoLongerExistsException: Exception {
  override var reason: String {
    "The specified calendar item no longer exists."
  }
}

final internal class DueDateRequiredException: Exception {
  override var reason: String {
    "A repeating reminder must have a due date."
  }
}

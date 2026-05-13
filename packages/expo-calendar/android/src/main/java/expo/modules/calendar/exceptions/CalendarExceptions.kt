package expo.modules.calendar.exceptions

import expo.modules.kotlin.exception.CodedException

class CalendarNotSavedException(message: String, cause: Throwable? = null) :
  CodedException("E_CALENDARS_NOT_SAVED", message, cause)

class CalendarsNotFoundException(message: String, cause: Throwable? = null) :
  CodedException("E_CALENDARS_NOT_FOUND", message, cause)

class CalendarNotDeletedException(message: String, cause: Throwable? = null) :
  CodedException("E_CALENDARS_NOT_DELETED", message, cause)

package expo.modules.calendar.exceptions

import expo.modules.kotlin.exception.CodedException

class AttendeeNotSavedException(message: String, cause: Throwable? = null) :
  CodedException("E_ATTENDEE_NOT_SAVED", message, cause)

class AttendeeNotDeletedException(message: String, cause: Throwable? = null) :
  CodedException("E_ATTENDEE_NOT_DELETED", message, cause)

package expo.modules.calendar.next.exceptions

import expo.modules.kotlin.exception.CodedException

class AttendeeNotFoundException(message: String, cause: Throwable? = null)
  : CodedException(message, cause)

class AttendeeCouldNotBeCreatedException(message: String, cause: Throwable? = null)
  : CodedException(message, cause)

class AttendeeCouldNotBeDeletedException(message: String, cause: Throwable? = null)
  : CodedException(message, cause)

class AttendeeCouldNotBeUpdatedException(message: String, cause: Throwable? = null)
  : CodedException(message, cause)
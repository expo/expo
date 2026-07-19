package expo.modules.calendar.next.exceptions

import expo.modules.kotlin.exception.CodedException

class DateParseException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

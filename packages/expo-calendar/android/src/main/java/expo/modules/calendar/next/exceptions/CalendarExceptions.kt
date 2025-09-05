package expo.modules.calendar.next.exceptions
import expo.modules.kotlin.exception.CodedException

class CalendarNotFoundException(message: String, cause: Throwable? = null)
  : CodedException(message, cause)

class CalendarNotSupportedException(message: String, cause: Throwable? = null)
  : CodedException(message, cause)
class CalendarCouldNotBeDeletedException(message: String, cause: Throwable? = null)
  : CodedException(message, cause)

class CalendarCouldNotBeUpdatedException(message: String, cause: Throwable? = null)
  : CodedException(message, cause)

class CalendarParsingException(message: String, cause: Throwable? = null)
  : CodedException(message, cause)

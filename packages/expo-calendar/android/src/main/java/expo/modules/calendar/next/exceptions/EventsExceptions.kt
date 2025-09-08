package expo.modules.calendar.next.exceptions
import expo.modules.kotlin.exception.CodedException

class EventNotFoundException(message: String, cause: Throwable? = null)
  : CodedException(message, cause)

class EventsCouldNotBeCreatedException(message: String, cause: Throwable? = null)
  : CodedException(message, cause)

class EventCouldNotBeDeletedException(message: String, cause: Throwable? = null)
  : CodedException(message, cause)

class EventDateTimeInvalidException(message: String, cause: Throwable? = null)
  : CodedException(message, cause)

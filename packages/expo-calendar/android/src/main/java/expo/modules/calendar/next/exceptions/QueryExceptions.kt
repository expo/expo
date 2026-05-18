package expo.modules.calendar.next.exceptions

import expo.modules.kotlin.exception.CodedException

class CouldNotExecuteQueryException(override val message: String?, cause: Throwable? = null) :
  CodedException(message, cause)

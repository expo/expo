package expo.modules.calendar.next.exceptions

import expo.modules.kotlin.exception.CodedException

class ExtendedPropertyNameNotSyncSafeException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

class ExtendedPropertyAccountMissingException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

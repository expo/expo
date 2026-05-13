package expo.modules.calendar.exceptions

import expo.modules.kotlin.exception.CodedException

class FieldMissingException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

class ColumnMissingException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

class DateParseException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

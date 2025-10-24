package expo.modules.agerange

import expo.modules.kotlin.exception.CodedException

internal class AgeRangeException(code: String, reason: String, cause: Throwable? = null) :
  CodedException(
    code,
    "[ExpoAgeRange]: $reason",
    cause
  )

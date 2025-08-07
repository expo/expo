package expo.modules.integrity

import expo.modules.kotlin.exception.CodedException

internal class IntegrityException(reason: String, cause: Throwable? = null) :
  CodedException(
    "[ExpoAppIntegrity]: $reason",
    cause
  )

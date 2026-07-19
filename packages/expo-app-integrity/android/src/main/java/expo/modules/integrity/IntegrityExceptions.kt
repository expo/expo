package expo.modules.integrity

import expo.modules.kotlin.exception.CodedException

internal class IntegrityException(code: String, reason: String, cause: Throwable? = null) :
  CodedException(
    code,
    "[ExpoAppIntegrity]: $reason",
    cause
  )

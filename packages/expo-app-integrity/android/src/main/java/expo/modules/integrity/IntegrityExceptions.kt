package expo.modules.integrity

import expo.modules.kotlin.exception.CodedException

internal class IntegrityException(reason: String, code: String, cause: Throwable? = null) :
  CodedException(
    code,
    "[ExpoAppIntegrity]: $reason",
    cause
  )

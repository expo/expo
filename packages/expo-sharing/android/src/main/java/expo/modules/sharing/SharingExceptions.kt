package expo.modules.sharing

import expo.modules.kotlin.exception.CodedException

internal class MissingCurrentActivityException :
  CodedException("Activity which was provided during module initialization is no longer available")

internal class SharingInProgressException :
  CodedException("Another share request is being processed now.")

internal class SharingFailedException(message: String, e: Exception) :
  CodedException(message, e.cause)

internal class SharingInvalidArgsException(message: String?, e: Exception) :
  CodedException(message, e.cause)

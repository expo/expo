package expo.modules.sharing

import expo.modules.kotlin.exception.CodedException

internal class SharingInProgressException :
  CodedException("Another share request is being processed now.")

internal class SharingFailedException(message: String, e: Exception) :
  CodedException(message, e.cause)

internal class SharingInvalidArgsException(message: String?, e: Exception) :
  CodedException(message, e.cause)

internal class FailedToResolveSharedDataException(message: String?, cause: Throwable? = null) :
  CodedException(message ?: "Unexpected error while resolving shared data", cause)

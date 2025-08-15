package expo.modules.medialibrary.next.exceptions

import expo.modules.kotlin.exception.CodedException

class PermissionsException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

class UnableToSaveException(message: String) :
  CodedException(message)

class AssetNotFoundException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

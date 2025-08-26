package expo.modules.medialibrary.next.exceptions

import expo.modules.kotlin.exception.CodedException

class PermissionsException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

class UnableToSaveException(message: String) :
  CodedException(message)

class AssetNotFoundException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

class AssetPropertyNotFoundException(propertyName: String, cause: Throwable? = null) :
  CodedException("$propertyName not found. The asset may have been deleted or is no longer accessible.", cause)

class AssetCouldNotBeCreated(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

class AssetInitializationException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

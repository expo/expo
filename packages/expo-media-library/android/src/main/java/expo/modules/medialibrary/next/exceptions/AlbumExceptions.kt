package expo.modules.medialibrary.next.exceptions

import expo.modules.kotlin.exception.CodedException

class AlbumNotFoundException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

class AlbumAlreadyExistsException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

class AlbumPropertyNotFoundException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

class AlbumCouldNotBeCreated(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

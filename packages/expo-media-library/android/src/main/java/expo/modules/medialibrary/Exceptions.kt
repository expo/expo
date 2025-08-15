package expo.modules.medialibrary

import expo.modules.kotlin.exception.CodedException

class AlbumException(message: String) :
  CodedException(message)

class MediaLibraryException :
  CodedException("Media library is corrupted")

class EmptyAlbumException :
  CodedException("Found album is empty")

class AlbumPathException :
  CodedException("Couldn't get album path")

class AlbumNotFound :
  CodedException("Couldn't find album")

class AssetQueryException :
  CodedException("Could not get asset. Query returns null")

class PermissionsException(message: String) :
  CodedException(message)

class AssetException :
  CodedException("Could not add image to gallery")

class ContentEntryException :
  CodedException("Could not create content entry")

class AssetFileException(message: String) :
  CodedException(message)

class UnableToLoadPermissionException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

class UnableToLoadException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

class UnableToDeleteException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

class UnableToSaveException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

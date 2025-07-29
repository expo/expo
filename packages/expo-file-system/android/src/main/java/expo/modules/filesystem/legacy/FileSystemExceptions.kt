package expo.modules.filesystem.legacy

import android.net.Uri
import expo.modules.kotlin.exception.CodedException

internal class FileSystemOkHttpNullException :
  CodedException("okHttpClient is null")

internal class FileSystemCannotReadDirectoryException(uri: Uri?) :
  CodedException("Uri '$uri' doesn't exist or isn't a directory")

internal class FileSystemCannotCreateDirectoryException(uri: Uri?) :
  CodedException(
    uri?.let {
      "Directory '$it' could not be created or already exists"
    } ?: "Unknown error"
  )

internal class FileSystemUnreadableDirectoryException(uri: String) :
  CodedException("No readable files with the uri '$uri'. Please use other uri")

internal class FileSystemCannotCreateFileException(uri: Uri?) :
  CodedException(
    uri?.let {
      "Provided uri '$it' is not pointing to a directory"
    } ?: "Unknown error"
  )

internal class FileSystemFileNotFoundException(uri: Uri?) :
  CodedException("File '$uri' could not be deleted because it could not be found")

internal class FileSystemPendingPermissionsRequestException :
  CodedException("You have an unfinished permission request")

internal class FileSystemCannotMoveFileException(fromUri: Uri, toUri: Uri) :
  CodedException("File '$fromUri' could not be moved to '$toUri'")

internal class FileSystemUnsupportedSchemeException :
  CodedException("Can't read Storage Access Framework directory, use StorageAccessFramework.readDirectoryAsync() instead")

internal class FileSystemCannotFindTaskException :
  CodedException("Cannot find task")

internal class FileSystemCopyFailedException(uri: Uri?) :
  CodedException("File '$uri' could not be copied because it could not be found")

internal class CookieHandlerNotFoundException :
  CodedException("Failed to find CookieHandler")

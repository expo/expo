package expo.modules.filesystem

import android.net.Uri
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.services.FilePermissionService

internal class CopyOrMoveDirectoryToFileException :
  CodedException("Unable to copy or move a folder to a file")

internal class InvalidTypeFolderException :
  CodedException("A file with the same name already exists in the folder location")

internal class InvalidTypeFileException :
  CodedException("A folder with the same name already exists in the file location")

internal class DestinationDoesNotExistException :
  CodedException("The destination path does not exist")

internal class UnableToDownloadException(reason: String) :
  CodedException("Unable to download a file: $reason")

internal class UnableToDeleteException(reason: String) :
  CodedException("Unable to delete file or directory: $reason")

internal class UnableToCreateException(reason: String) :
  CodedException("Unable to create file or directory: $reason")

internal class InvalidPermissionException(permission: FilePermissionService.Permission) :
  CodedException("Missing '${permission.name}' permission for accessing the file.")

internal class UnableToReadHandleException(reason: String) :
  CodedException("Unable to read from a file handle: '$reason'")

internal class UnableToWriteHandleException(reason: String) :
  CodedException("Unable to write to a file handle: '$reason'")

internal class UnsupportedContentUriReadWriteException :
  CodedException(
    "READ_WRITE mode is not supported for content:// URIs. " +
      "Content providers may not support simultaneous read and write access. " +
      "Use READ or WRITE mode instead."
  )

internal class MissingAppContextException :
  CodedException("The app context is missing.")

internal class PickerCancelledException :
  CodedException("The file picker was cancelled by the user")

internal class DestinationAlreadyExistsException :
  CodedException("Destination already exists")

internal class UnableToCopyException(reason: String) :
  CodedException("Unable to copy file or directory: $reason")

internal class UnableToMoveException(reason: String) :
  CodedException("Unable to move file or directory: $reason")

internal class UnableToUploadException(reason: String) :
  CodedException("Unable to upload a file: $reason")

internal class UploadCancelledException :
  CodedException("Upload was cancelled")

internal class InvalidResumeDataException :
  CodedException("Invalid resume data provided")

internal class DownloadCancelledException :
  CodedException("Download was cancelled")

internal class WatcherSetupException(path: String) :
  CodedException("Cannot start watching path '$path'")

internal class WatcherPermissionException(path: String) :
  CodedException("No permission to watch path '$path'")

internal class WatcherPathNotFoundException(path: String) :
  CodedException("Path does not exist: '$path'")

internal class WatcherUnsupportedPathException(path: String) :
  CodedException("Cannot watch path '$path'. Only local file:// paths are supported.")

internal class FilePreviewUnsupportedException(mimeType: String?, cause: Throwable? = null) :
  CodedException(
    mimeType?.let { "No app can preview files of type '$it'." }
      ?: "No MIME type could be resolved for this file.",
    cause
  )

internal class FilePreviewFileNotFoundException(uri: Uri) :
  CodedException("File does not exist: '$uri'")

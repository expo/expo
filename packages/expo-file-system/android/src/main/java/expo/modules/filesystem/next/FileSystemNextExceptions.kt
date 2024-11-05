package expo.modules.filesystem.next
import expo.modules.interfaces.filesystem.Permission
import expo.modules.kotlin.exception.CodedException

internal class CopyOrMoveDirectoryToFileException :
  CodedException("Unable to copy or move a folder to a file")

internal class InvalidTypeFolderException :
  CodedException("A file with the same name already exists in the folder location")

internal class InvalidTypeFileException :
  CodedException("A folder with the same name already exists in the file location")

internal class DestinationDoesNotExistException :
  CodedException("The destination path does not exist")

internal class UnableToDownloadException(reason: String) :
  CodedException(
    "Unable to download a file: $reason"
  )

internal class UnableToDeleteException(reason: String) :
  CodedException(
    "Unable to delete file or directory: $reason"
  )

internal class InvalidPermissionException(permission: Permission) :
  CodedException(
    "Missing '${permission.name}' permission for accessing the file."
  )

internal class DestinationAlreadyExistsException :
  CodedException(
    "Destination already exists"
  )

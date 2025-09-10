import Foundation
import ExpoModulesCore

internal final class CopyOrMoveDirectoryToFileException: Exception {
  override var reason: String {
    "Unable to copy or move a directory to a file"
  }
}

internal final class UnableToDownloadException: GenericException<String> {
  override var reason: String {
    "Unable to download a file: \(param)"
  }
}

internal final class InvalidTypeFileException: Exception {
  override var reason: String {
    "A folder with the same name already exists in the file location"
  }
}

internal final class InvalidTypeDirectoryException: Exception {
  override var reason: String {
    "A file with the same name already exists in the directory location"
  }
}

internal final class UnableToGetFileAttribute: GenericException<String> {
  override var reason: String {
    "Unable to get file attribute: \(param)"
  }
}

internal final class UnableToGetSizeException: GenericException<String> {
  override var reason: String {
    "Unable to get file or directory size: \(param)"
  }
}

internal final class UnableToDeleteException: GenericException<String> {
  override var reason: String {
    "Unable to delete file or directory: \(param)"
  }
}

internal final class UnableToCreateException: GenericException<String> {
  override var reason: String {
    "Unable to create file or directory: \(param)"
  }
}

internal final class UnableToReadHandleException: GenericException<String> {
  override var reason: String {
    "Unable to read from a file handle: \(param)"
  }
}

internal final class UnableToGetInfoException: GenericException<String> {
  override var reason: String {
    "Unable to get info from a file: \(param)"
  }
}

internal final class DestinationAlreadyExistsException: Exception {
  override var reason: String {
    "Destination already exists"
  }
}

internal final class MissingPermissionException: GenericException<String> {
  override var reason: String {
    "Missing permission for uri: \(param)"
  }
}

internal final class PickingInProgressException: Exception {
  override var reason: String {
    "File picking is already in progress"
  }
}

internal final class MissingViewControllerException: Exception {
  override var reason: String {
    "No view controller available for presenting file picker"
  }
}

internal final class FilePickingCancelledException: Exception {
  override var reason: String {
    "File picking was cancelled by the user"
  }
}

internal final class NotImplementedException: Exception {
  override var reason: String {
    "Not implemented"
  }
}

internal final class FeatureNotAvailableOnPlatformException: Exception {
  override var reason: String {
    "This feature is not available on this platform"
  }
}

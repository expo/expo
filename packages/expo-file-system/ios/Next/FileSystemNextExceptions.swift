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

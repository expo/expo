import Foundation
import ExpoModulesCore

internal class CopyOrMoveDirectoryToFileException: Exception {
  override var reason: String {
    "Unable to copy or move a directory to a file"
  }
}

internal class UnableToDownloadException: GenericException<String> {
  override var reason: String {
    "Unable to download a file: \(param)"
  }
}

internal class InvalidTypeFileException: Exception {
  override var reason: String {
    "A folder with the same name already exists in the file location"
  }
}

internal class InvalidTypeDirectoryException: Exception {
  override var reason: String {
    "A file with the same name already exists in the directory location"
  }
}

internal class UnableToGetFileSizeException: GenericException<String> {
  override var reason: String {
    "Unable to get file size: \(param)"
  }
}

internal class UnableToDeleteException: GenericException<String> {
  override var reason: String {
    "Unable to delete file or directory: \(param)"
  }
}

internal class UnableToCreateDirectoryException: GenericException<String> {
  override var reason: String {
    "Unable to create directory: \(param)"
  }
}

internal class UnableToCreateFileException: GenericException<String> {
  override var reason: String {
    "Unable to create file: \(param)"
  }
}

internal class UnableToReadHandleException: GenericException<String> {
  override var reason: String {
    "Unable to read from a file handle: \(param)"
  }
}

internal class DestinationAlreadyExistsException: Exception {
  override var reason: String {
    "Destination already exists"
  }
}

import Foundation
import ExpoModulesCore

internal class CopyDirectoryToFileException: Exception {
  override var reason: String {
    "Unable to copy a directory to a file"
  }
}

internal class MoveDirectoryToFileException: Exception {
  override var reason: String {
    "Unable to move a directory to a file"
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

internal class InvalidTypeFolderException: Exception {
  override var reason: String {
    "A file with the same name already exists in the folder location"
  }
}

internal class UnableToGetFileSizeException: GenericException<String> {
  override var reason: String {
    "Unable to get file size: \(param)"
  }
}

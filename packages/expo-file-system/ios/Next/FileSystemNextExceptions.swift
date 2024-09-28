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

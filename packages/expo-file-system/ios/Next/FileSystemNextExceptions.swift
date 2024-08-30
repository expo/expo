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

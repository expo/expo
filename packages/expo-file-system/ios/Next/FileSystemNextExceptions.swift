import Foundation
import ExpoModulesCore

let defaultErrorMessage = "unspecified error"

internal class CopyFolderToFileException: Exception {
  override var reason: String {
    "Unable to copy a folder to a file"
  }
}

internal class MoveFolderToFileException: Exception {
  override var reason: String {
    "Unable to move a folder to a file"
  }
}

internal class UnableToDownloadException: GenericException<String> {
  override var reason: String {
    "Unable to download a file: \(param)"
  }
}

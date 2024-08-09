import Foundation
import ExpoModulesCore

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

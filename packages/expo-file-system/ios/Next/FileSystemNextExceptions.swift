import Foundation
import ExpoModulesCore

internal class InvalidDirectoryPathException: GenericException<String> {
  override var reason: String {
    "Path \(param) is not a valid path to a local directory"
  }
}


internal class InvalidFilePathException: GenericException<String> {
  override var reason: String {
    "Path \(param) is not a valid path to a local file"
  }
}

import Foundation
import ExpoModulesCore

internal final class FileSystemNextFile: FileSystemNextPath {
  func create() {
    FileManager.default.createFile(atPath: url.path, contents: nil)
  }
}

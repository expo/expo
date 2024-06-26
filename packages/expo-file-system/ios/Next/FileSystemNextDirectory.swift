import Foundation
import ExpoModulesCore

internal final class FileSystemNextDirectory: FileSystemNextPath {
  func create() throws {
    try FileManager.default.createDirectory(at: url, withIntermediateDirectories: false)
  }
  func validatePath() throws {
    guard url.isFileURL && url.hasDirectoryPath else {
      throw Exception(name: "wrong type", description: "tried to create a directory with a file path")
    }
  }
}

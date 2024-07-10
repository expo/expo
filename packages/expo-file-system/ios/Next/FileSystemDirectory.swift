import Foundation
import ExpoModulesCore

internal final class FileSystemDirectory: FileSystemPath {
  override init(url: URL) {
    if url.hasDirectoryPath {
      super.init(url: url)
      return
    }
    super.init(url: url.deletingLastPathComponent().appendingPathComponent(url.lastPathComponent, isDirectory: true))
  }
  func create() throws {
    try FileManager.default.createDirectory(at: url, withIntermediateDirectories: false)
  }
  func exists() -> Bool {
    var isDirectory: ObjCBool = false
    if FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) {
      return isDirectory.boolValue
    }
    return false
  }
  func validatePath() throws {
    guard url.isFileURL && url.hasDirectoryPath else {
      throw Exception(name: "wrong type", description: "tried to create a directory with a file path")
    }
  }
}

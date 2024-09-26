import Foundation
import ExpoModulesCore

internal final class FileSystemDirectory: FileSystemPath {
  init(url: URL) {
    super.init(url: url, isDirectory: true)
  }

  func validateType() throws {
    var isDirectory: ObjCBool = false
    if FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) {
      if !isDirectory.boolValue {
        throw InvalidTypeFolderException()
      }
    }
  }

  func create() throws {
    try validateType()
    try FileManager.default.createDirectory(at: url, withIntermediateDirectories: false)
  }

  var exists: Bool {
    var isDirectory: ObjCBool = false
    if FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) {
      return isDirectory.boolValue
    }
    return false
  }

  // Internal only function
  func listAsRecords() throws -> [[String: Any]] {
    var contents: [[String: Any]] = []

    let items = try FileManager.default.contentsOfDirectory(at: url, includingPropertiesForKeys: nil)
      for item in items {
        contents.append(["isDirectory": item.hasDirectoryPath, "path": item.absoluteString])
      }
    return contents
  }

  func validatePath() throws {
    guard url.isFileURL && url.hasDirectoryPath else {
      throw Exception(name: "wrong type", description: "tried to create a directory with a file path")
    }
  }
}

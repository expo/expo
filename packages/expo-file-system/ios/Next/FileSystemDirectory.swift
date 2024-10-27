import Foundation
import ExpoModulesCore

internal final class FileSystemDirectory: FileSystemPath {
  init(url: URL) {
    super.init(url: url, isDirectory: true)
  }

  func validateType() throws {
    try validatePermission(.read)
    var isDirectory: ObjCBool = false
    if FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) {
      if !isDirectory.boolValue {
        throw InvalidTypeDirectoryException()
      }
    }
  }

  func create() throws {
    try validateType()
    try validatePermission(.write)
    guard !exists else {
      throw UnableToCreateDirectoryException("directory already exists")
    }
    do {
      try FileManager.default.createDirectory(at: url, withIntermediateDirectories: false)
    } catch {
      throw UnableToCreateDirectoryException(error.localizedDescription)
    }
  }

  var exists: Bool {
    do {
      try validatePermission(.read)
    } catch {
      return false
    }

    var isDirectory: ObjCBool = false
    if FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) {
      return isDirectory.boolValue
    }
    return false
  }

  // Internal only function
  func listAsRecords() throws -> [[String: Any]] {
    try validatePermission(.read)
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

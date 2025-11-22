import Foundation
import ExpoModulesCore

internal final class FileSystemDirectory: FileSystemPath {
  init(url: URL) {
    super.init(url: url, isDirectory: true)
  }

  override func validateType() throws {
    try withCorrectTypeAndScopedAccess(permission: .read) {
      var isDirectory: ObjCBool = false
      if FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) {
        if !isDirectory.boolValue {
          throw InvalidTypeDirectoryException()
        }
      }
    }
  }

  func create(_ options: CreateOptions) throws {
    try withCorrectTypeAndScopedAccess(permission: .write) {
      guard try needsCreation(options) else {
        return
      }
      try validateCanCreate(options)
      do {
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: options.intermediates, attributes: nil)
      } catch {
        throw UnableToCreateException(error.localizedDescription)
      }
    }
  }

  var size: Int64 {
    get throws {
      try validatePermission(.read)
      var size: Int64 = 0
      guard let subpaths = try? FileManager.default.subpathsOfDirectory(atPath: url.path) else {
        throw UnableToGetSizeException("attributes do not contain size")
      }
      for subpath in subpaths {
        let strSubpath = url.appendingPathComponent(subpath).path
        guard let attributes: [FileAttributeKey: Any] = try? FileManager.default.attributesOfItem(atPath: strSubpath), let subpathSize = attributes[.size] as? Int64 else {
          continue
        }
        size += subpathSize
      }
      return size
    }
  }

  override var exists: Bool {
    guard checkPermission(.read) else {
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
    try withCorrectTypeAndScopedAccess(permission: .read) {
    var contents: [[String: Any]] = []

    let items = try FileManager.default.contentsOfDirectory(at: url, includingPropertiesForKeys: nil)
      for item in items {
        contents.append(["isDirectory": item.hasDirectoryPath, "uri": item.absoluteString])
      }
      return contents
    }
  }

  func validatePath() throws {
    guard url.isFileURL && url.hasDirectoryPath else {
      throw Exception(name: "wrong type", description: "tried to create a directory with a file path")
    }
  }

  func info() throws -> DirectoryInfo {
    try withCorrectTypeAndScopedAccess(permission: .read) {
      if !exists {
        let result = DirectoryInfo()
        result.exists = false
        result.uri = url.absoluteString
        return result
      }
      switch url.scheme {
      case "file":
        let result = DirectoryInfo()
        result.exists = true
        result.uri = url.absoluteString
        result.size = try size
        result.files = (try? FileManager.default.contentsOfDirectory(atPath: url.path)) ?? []
        result.modificationTime = try modificationTime
        result.creationTime = try creationTime
        return result
      default:
        throw UnableToGetInfoException("url scheme \(String(describing: url.scheme)) is not supported")
      }
    }
  }

  func needsCreation(_ options: CreateOptions) throws -> Bool {
    if !exists {
      return true
    }
    return !options.idempotent
  }
}

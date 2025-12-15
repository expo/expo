import Foundation
import ExpoModulesCore
import CryptoKit
import UniformTypeIdentifiers

internal final class FileSystemFile: FileSystemPath {
  init(url: URL) {
    super.init(url: url, isDirectory: false)
  }

  override func validateType() throws {
    var isDirectory: ObjCBool = false
    if FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) {
      if isDirectory.boolValue {
        throw InvalidTypeFileException()
      }
    }
  }

  func create(_ options: CreateOptions) throws {
    try withCorrectTypeAndScopedAccess(permission: .write) {
      try validateCanCreate(options)
      do {
        if options.intermediates {
          try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        }
        try? FileManager.default.removeItem(atPath: url.path)
        FileManager.default.createFile(atPath: url.path, contents: nil)
      } catch {
        throw UnableToCreateException(error.localizedDescription)
      }
    }
  }

  override var exists: Bool {
    guard checkPermission(.read) else {
      return false
    }
    var isDirectory: ObjCBool = false
    if FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) {
      return !isDirectory.boolValue
    }
    return false
  }

  // TODO: Move to the constructor once error is rethrowed
  func validatePath() throws {
    guard url.isFileURL && !url.hasDirectoryPath else {
      throw Exception(name: "wrong type", description: "tried to create a file with a directory path")
    }
  }

  var md5: String {
    get throws {
      return try withCorrectTypeAndScopedAccess(permission: .read) {
        let fileData = try Data(contentsOf: url)
        let hash = Insecure.MD5.hash(data: fileData)
        return hash.map { String(format: "%02hhx", $0) }.joined()
      }
    }
  }

  var size: Int64 {
    get throws {
      return try getAttribute(.size, atPath: url.path)
    }
  }

  var type: String? {
    let pathExtension = url.pathExtension
    if let utType = UTType(filenameExtension: pathExtension),
      let mimeType = utType.preferredMIMEType {
      return mimeType
    }
    return nil
  }

  func write(_ content: String) throws {
    try withCorrectTypeAndScopedAccess(permission: .write) {
      try content.write(to: url, atomically: false, encoding: .utf8) // TODO: better error handling
    }
  }

  func write(_ data: Data) throws {
    try withCorrectTypeAndScopedAccess(permission: .write) {
      try data.write(to: url)
    }
  }

  // TODO: blob support
  func write(_ content: TypedArray) throws {
    try withCorrectTypeAndScopedAccess(permission: .write) {
      try Data(bytes: content.rawPointer, count: content.byteLength).write(to: url)
    }
  }

  func text() throws -> String {
    return try withCorrectTypeAndScopedAccess(permission: .write) {
      return try String(contentsOf: url)
    }
  }

  func bytes() throws -> Data {
    return try withCorrectTypeAndScopedAccess(permission: .write) {
      return try Data(contentsOf: url)
    }
  }

  func base64() throws -> String {
    return try withCorrectTypeAndScopedAccess(permission: .read) {
      return try Data(contentsOf: url).base64EncodedString()
    }
  }

  func info(options: InfoOptions) throws -> FileInfo {
    return try withCorrectTypeAndScopedAccess(permission: .read) {
      if !exists {
        let result = FileInfo()
        result.exists = false
        result.uri = url.absoluteString
        return result
      }
      switch url.scheme {
      case "file":
        let result = FileInfo()
        result.exists = true
        result.uri = url.absoluteString
        result.size = try size
        result.modificationTime = try modificationTime
        result.creationTime = try creationTime
        if options.md5 {
          result.md5 = try md5
        }
        return result
      default:
        throw UnableToGetInfoException("url scheme \(String(describing: url.scheme)) is not supported")
      }
    }
  }
}

import Foundation
import ExpoModulesCore
import CryptoKit

internal final class FileSystemFile: FileSystemPath {
  init(url: URL) {
    super.init(url: url, isDirectory: false)
  }

  func validateType() throws {
    var isDirectory: ObjCBool = false
    if FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) {
      if isDirectory.boolValue {
        throw InvalidTypeFileException()
      }
    }
  }

  func create() throws {
    try validateType()
    guard !exists else {
      throw UnableToCreateFileException("file already exists")
    }
    FileManager.default.createFile(atPath: url.path, contents: nil)
  }

  var exists: Bool {
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

  var size: Int64 {
    get throws {
      let attributes: [FileAttributeKey: Any] = try FileManager.default.attributesOfItem(atPath: url.path)
      guard let size = attributes[.size] else {
        throw UnableToGetFileSizeException("attributes do not contain size")
      }
      guard let size = size as? NSNumber else {
        throw UnableToGetFileSizeException("size is not a number")
      }
      return size.int64Value
    }
  }

  var md5: String {
    get throws {
      let fileData = try Data(contentsOf: url)
      let hash = Insecure.MD5.hash(data: fileData)
      return hash.map { String(format: "%02hhx", $0) }.joined()
    }
  }

  func write(_ content: String) throws {
    try validateType()
    try content.write(to: url, atomically: false, encoding: .utf8) // TODO: better error handling
  }

  // TODO: typedarray, blobs, others support
  func write(_ content: TypedArray) throws {
  }

  func text() throws -> String {
    try validateType()
    return try String(contentsOf: url)
  }

  func base64() throws -> String {
    return try Data(contentsOf: url).base64EncodedString()
  }
}

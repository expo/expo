import Foundation
import ExpoModulesCore
import CryptoKit
import UniformTypeIdentifiers

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

  func create(_ options: CreateOptions) throws {
    try validatePermission(.write)
    try validateType()
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

  override var exists: Bool {
    get throws {
      try validatePermission(.read)

      var isDirectory: ObjCBool = false
      if FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory) {
        return !isDirectory.boolValue
      }
      return false
    }
  }

  // TODO: Move to the constructor once error is rethrowed
  func validatePath() throws {
    guard url.isFileURL && !url.hasDirectoryPath else {
      throw Exception(name: "wrong type", description: "tried to create a file with a directory path")
    }
  }

  var size: Int64 {
    get throws {
      try validatePermission(.read)
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
      try validatePermission(.read)
      let fileData = try Data(contentsOf: url)
      let hash = Insecure.MD5.hash(data: fileData)
      return hash.map { String(format: "%02hhx", $0) }.joined()
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
    try validateType()
    try validatePermission(.write)
    try content.write(to: url, atomically: false, encoding: .utf8) // TODO: better error handling
  }

  // TODO: blob support
  func write(_ content: TypedArray) throws {
    try validateType()
    try validatePermission(.write)
    try Data(bytes: content.rawPointer, count: content.byteLength).write(to: url)
  }

  func text() throws -> String {
    try validateType()
    try validatePermission(.read)
    return try String(contentsOf: url)
  }

  func bytes() throws -> Data {
    try validateType()
    try validatePermission(.read)
    return try Data(contentsOf: url)
  }

  func base64() throws -> String {
    try validatePermission(.read)
    return try Data(contentsOf: url).base64EncodedString()
  }
}

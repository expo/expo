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
      try validatePermission(.read)
      let fileData = try Data(contentsOf: url)
      let hash = Insecure.MD5.hash(data: fileData)
      return hash.map { String(format: "%02hhx", $0) }.joined()
    }
  }

  var size: Int64 {
    get throws {
      return try getAttribute(.size, atPath: url.path)
    }
  }

  var modificationTime: Int64 {
    get throws {
      let modificationDate: Date = try getAttribute(.modificationDate, atPath: url.path)
      return Int64(modificationDate.timeIntervalSince1970 * 1000)
    }
  }

  var creationTime: Int64 {
    get throws {
      let creationDate: Date = try getAttribute(.creationDate, atPath: url.path)
      return Int64(creationDate.timeIntervalSince1970 * 1000)
    }
  }

  private func getAttribute<T>(_ key: FileAttributeKey, atPath path: String) throws -> T {
    try validatePermission(.read)
    let attributes = try FileManager.default.attributesOfItem(atPath: path)

    guard let attribute = attributes[key] else {
      throw UnableToGetFileAttribute("attributes do not contain \(key)")
    }
    guard let attributeCasted = attribute as? T else {
      throw UnableToGetFileAttribute("\(key) is not of expected type")
    }
    return attributeCasted
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

  func info(options: InfoOptions) throws -> FileInfo {
    try validateType()
    try validatePermission(.read)
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

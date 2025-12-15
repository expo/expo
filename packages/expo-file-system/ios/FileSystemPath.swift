import Foundation
import ExpoModulesCore

internal class FileSystemPath: SharedObject {
  var url: URL

  func validateType() throws {
    throw NotImplementedException()
  }

  init(url: URL, isDirectory: Bool) {
    let standardizedUrl = url.deletingLastPathComponent().appendingPathComponent(url.lastPathComponent, isDirectory: isDirectory)
    self.url = standardizedUrl
  }

  func validatePermission(_ flag: FileSystemPermissionFlags) throws {
    if !checkPermission(flag) {
      throw MissingPermissionException(url.absoluteString)
    }
  }

  func checkPermission(_ flag: FileSystemPermissionFlags) -> Bool {
    return FileSystemUtilities.permissions(appContext, for: url).contains(flag)
  }

  func validateCanCreate(_ options: CreateOptions) throws {
    if try !options.overwrite && exists {
      throw FileAlreadyExistsException(url.absoluteString)
    }
  }

  var exists: Bool {
    get throws {
      FileManager.default.fileExists(atPath: url.path)
    }
  }

  func delete() throws {
    try validatePermission(.write)
    guard FileManager.default.fileExists(atPath: url.path) else {
      throw UnableToDeleteException("path does not exist")
    }
    do {
      try FileManager.default.removeItem(at: url)
    } catch {
      throw UnableToDeleteException(error.localizedDescription)
    }
  }

  func getMoveOrCopyPath(to destination: FileSystemPath) throws -> URL {
    if let destination = destination as? FileSystemDirectory {
      if self is FileSystemFile {
        return destination.url.appendingPathComponent(url.lastPathComponent)
      }
      // self if FileSystemDirectory
      // we match unix behavior https://askubuntu.com/a/763915
      if destination.exists {
        return destination.url.appendingPathComponent(url.lastPathComponent, isDirectory: true)
      }
      return destination.url
    }
    // destination is FileSystemFile
    guard self is FileSystemFile else {
      throw CopyOrMoveDirectoryToFileException()
    }
    return destination.url
  }

  func copy(to destination: FileSystemPath) throws {
    try validatePermission(.read)
    try destination.validatePermission(.write)
    try FileManager.default.copyItem(at: url, to: getMoveOrCopyPath(to: destination))
  }

  func move(to destination: FileSystemPath) throws {
    try validatePermission(.write)
    try destination.validatePermission(.write)
    let destinationUrl = try getMoveOrCopyPath(to: destination)
    try FileManager.default.moveItem(at: url, to: destinationUrl)
    url = destinationUrl
  }

  func getRenamedUrl(newName: String) -> URL {
    return url.deletingLastPathComponent().appendingPathComponent(newName)
  }

  func rename(_ newName: String) throws {
    try validatePermission(.write)
    let newUrl = getRenamedUrl(newName: newName)
    try FileManager.default.moveItem(at: url, to: newUrl)
    // Refetch the URL to ensure it has the correct trailing slash, which differs for directories and files.
    let updatedUrl = getRenamedUrl(newName: newName)
    url = updatedUrl
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

  internal func getAttribute<T>(_ key: FileAttributeKey, atPath path: String) throws -> T {
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

  @discardableResult
  func withCorrectTypeAndScopedAccess<T>(
    permission: FileSystemPermissionFlags,
    _ work: () throws -> T
  ) throws -> T {
    let accessed = url.startAccessingSecurityScopedResource()
    defer { if accessed { url.stopAccessingSecurityScopedResource() } }

    try validatePermission(permission)

    return try work()
  }
}

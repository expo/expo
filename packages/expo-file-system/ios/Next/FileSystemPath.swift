import Foundation
import ExpoModulesCore

internal class FileSystemPath: SharedObject {
  var url: URL

  init(url: URL, isDirectory: Bool) {
    let standardizedUrl = url.deletingLastPathComponent().appendingPathComponent(url.lastPathComponent, isDirectory: isDirectory)
    self.url = standardizedUrl
  }

  func validatePermission(_ flag: EXFileSystemPermissionFlags) throws {
    try ensurePathPermission(appContext, path: url.path, flag: flag)
  }

  func validateCanCreate(_ options: CreateOptions) throws {
    if try !options.overwrite && exists {
      throw FileAlreadyExistsException("File already exists")
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
}

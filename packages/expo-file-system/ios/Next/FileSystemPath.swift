import Foundation
import ExpoModulesCore

internal class FileSystemPath: SharedObject {
  var url: URL

  init(url: URL, isDirectory: Bool) {
    let standardizedUrl = url.deletingLastPathComponent().appendingPathComponent(url.lastPathComponent, isDirectory: isDirectory)
    self.url = standardizedUrl
  }

  func delete() throws {
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
    try FileManager.default.copyItem(at: url, to: getMoveOrCopyPath(to: destination))
  }

  func move(to destination: FileSystemPath) throws {
    let destinationUrl = try getMoveOrCopyPath(to: destination)
    try FileManager.default.moveItem(at: url, to: destinationUrl)
    url = destinationUrl
  }
}

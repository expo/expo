import Foundation
import ExpoModulesCore

internal class FileSystemPath: SharedObject {
  let url: URL

  init(url: URL, isDirectory: Bool) {
    let standardizedUrl = url.deletingLastPathComponent().appendingPathComponent(url.lastPathComponent, isDirectory: isDirectory)
    self.url = standardizedUrl
  }

  func delete() throws {
    try FileManager.default.removeItem(at: url)
  }
  func copy(to destination: FileSystemPath) throws {
    if destination is FileSystemDirectory {
      try FileManager.default.copyItem(at: url, to: destination.url.appendingPathComponent(url.lastPathComponent))
    }
    if destination is FileSystemFile {
      guard !url.hasDirectoryPath else {
        throw CopyDirectoryToFileException()
      }
      try FileManager.default.copyItem(at: url, to: destination.url)
    }
  }

  func move(to destination: FileSystemPath) throws {
    if destination is FileSystemDirectory {
      try FileManager.default.moveItem(at: url, to: destination.url.appendingPathComponent(url.lastPathComponent))
    }
    if destination is FileSystemFile {
      guard !url.hasDirectoryPath else {
        throw MoveDirectoryToFileException()
      }
      try FileManager.default.moveItem(at: url, to: destination.url)
    }
  }
}

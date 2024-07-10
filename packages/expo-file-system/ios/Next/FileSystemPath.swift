import Foundation
import ExpoModulesCore

internal class FileSystemPath: SharedObject {
  let url: URL

  init(url: URL) {
    self.url = url
  }

  func delete() throws {
    try FileManager.default.removeItem(at: url)
  }
  func copy(to: FileSystemPath) throws {
    if to is FileSystemDirectory {
      try FileManager.default.copyItem(at: url, to: to.url.appendingPathComponent(url.lastPathComponent))
    }
    if to is FileSystemFile {
      guard !url.hasDirectoryPath else {
        throw CopyFolderToFileException()
      }
      try FileManager.default.copyItem(at: url, to: to.url)
    }
  }

  func move(to: FileSystemPath) throws {
    if to is FileSystemDirectory {
      try FileManager.default.moveItem(at: url, to: to.url.appendingPathComponent(url.lastPathComponent))
    }
    if to is FileSystemFile {
      guard !url.hasDirectoryPath else {
        throw MoveFolderToFileException()
      }
      try FileManager.default.moveItem(at: url, to: to.url)
    }
  }
}

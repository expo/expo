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

  func exists() -> Bool {
    return FileManager.default.fileExists(atPath: url.path)
  }
  func copy(to: FileSystemNextPath) throws {
    if(to is FileSystemNextDirectory) {
      try FileManager.default.copyItem(at: url, to: to.url.appendingPathComponent(url.lastPathComponent))
    }
    if(to is FileSystemNextFile) {
      try FileManager.default.copyItem(at: url, to: to.url)
    }
  }
}

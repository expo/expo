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
}

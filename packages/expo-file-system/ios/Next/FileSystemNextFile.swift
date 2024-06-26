import Foundation
import ExpoModulesCore

internal final class FileSystemNextFile: FileSystemNextPath {
  func create() {
    FileManager.default.createFile(atPath: url.path, contents: nil)
  }
  func validatePath() throws {
    guard url.isFileURL && !url.hasDirectoryPath else {
      throw Exception(name: "wrong type", description: "tried to create a file with a directory path")
    }
  }
  
  func write(_ content: Either<String, TypedArray>) throws {
    if let content: String = content.get() {
      try content.write(to: url, atomically: false, encoding: .utf8) // TODO: better error handling
    }
    // TODO: typedarray, blobs, others support
  }
  
  func text() throws -> String {
    return try String(contentsOf: url)
  }
}

import Foundation
import ExpoModulesCore

internal final class FileSystemNextDirectory: FileSystemNextPath {
  func create() throws {
    try FileManager.default.createDirectory(at: url, withIntermediateDirectories: false)
  }
}

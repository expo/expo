import Foundation
import ExpoModulesCore

internal final class FileSystemFileHandle: SharedRef<FileHandle> {
  let file: FileSystemFile
  let handle: FileHandle

  init(file: FileSystemFile) throws {
    self.file = file
    handle = try FileHandle(forUpdating: file.url)
    super.init(handle)
  }

  func read(_ length: Int) throws -> Data {
    do {
      let data = try handle.read(upToCount: length)
      return data ?? Data()
    } catch {
      throw UnableToReadHandleException(error.localizedDescription)
    }
  }

  func write(_ bytes: Data) throws {
    try handle.write(contentsOf: bytes)
  }

  func close() throws {
    try handle.close()
  }

  var offset: UInt64? {
    get {
      try? handle.offset()
    }
    set(newOffset) {
      guard let newOffset else {
        return
      }
      handle.seek(toFileOffset: newOffset)
    }
  }

  var size: UInt64? {
    do {
      let offset = try handle.offset()
      let size = try handle.seekToEnd()
      handle.seek(toFileOffset: offset)
      return size
    } catch {
      return nil
    }
  }
}

import Foundation
import ExpoModulesCore

internal final class FileSystemFileHandle: SharedObject {
  let file: FileSystemFile
  let handle: FileHandle

  init(file: FileSystemFile) throws {
    self.file = file
    self.handle = try FileHandle(forUpdating: file.url)
  }

  func read(_ length: Int) throws -> Data {
    var data: Data?
    do {
      data = try handle.read(upToCount: length)
    } catch {
      throw UnableToReadHandleException(error.localizedDescription)
    }
    // happens when there is no data at the end of the file
    guard let data = data else {
      return Data()
    }
    return data
  }

  func write(_ bytes: Data) {
    handle.write(bytes)
  }

  func close() throws {
    try handle.close()
  }

  var offset: UInt64 {
    get {
      handle.offsetInFile
    }
    set(newOffset) {
      handle.seek(toFileOffset: newOffset)
    }
  }
  var size: UInt64? {
    do {
      let offset = handle.offsetInFile
      let size = try handle.seekToEnd()
      handle.seek(toFileOffset: offset)
      return size
    } catch {
      return nil
    }
  }
}

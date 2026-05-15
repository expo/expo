import Foundation
import ExpoModulesCore

enum FileMode: String, Enumerable {
  /// Read-only
  case read = "r"
  /// Read & write
  case readWrite = "rw"
  /// Write-only
  case write = "w"
  /// Write-only. Appends to the end.
  case append = "wa"
  /// Write-only. Wipes file contents before writing.
  case truncate = "wt"

  var readOnly: Bool {
    return self == .read
  }

  var writeOnly: Bool {
    return self == .write || self == .append || self == .truncate
  }
}

@available(iOS 14, tvOS 14, *)
internal final class FileSystemFileHandle: SharedRef<FileHandle> {
  let file: FileSystemFile
  let mode: FileMode
  let handle: FileHandle

  init(file: FileSystemFile, mode: FileMode?) throws {
    self.file = file
    self.mode = mode ?? FileMode.readWrite
    if self.mode.readOnly {
      handle = try FileHandle(forReadingFrom: file.url)
    } else if self.mode.writeOnly {
      handle = try FileHandle(forWritingTo: file.url)
    } else {
      handle = try FileHandle(forUpdating: file.url)
    }

    if self.mode == FileMode.append {
      _ = try handle.seekToEnd()
    } else if self.mode == FileMode.truncate {
      try handle.truncate(atOffset: 0)
    }

    super.init(handle)
  }

  func read(_ length: Int) throws -> Data {
    if self.mode.writeOnly {
      throw UnableToReadHandleException("File opened write-only")
    }
    do {
      let data = try handle.read(upToCount: length)
      return data ?? Data()
    } catch {
      throw UnableToReadHandleException(error.localizedDescription)
    }
  }

  func write(_ bytes: Data) throws {
    if self.mode.readOnly {
      throw UnableToWriteHandleException("File opened read-only")
    }
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

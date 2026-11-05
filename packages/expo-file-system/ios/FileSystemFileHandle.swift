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

  /// Permissions a handle opened in this mode needs. Mirrors `FileMode.requiredPermissions()` on Android.
  var requiredPermissions: [FileSystemPermissionFlags] {
    switch self {
    case .read:
      return [.read]
    case .write, .append, .truncate:
      return [.write]
    case .readWrite:
      return [.read, .write]
    }
  }
}

@available(iOS 14, tvOS 14, *)
internal final class FileSystemFileHandle: SharedRef<FileHandle> {
  let file: FileSystemFile
  let mode: FileMode
  let handle: FileHandle
  private let didAccessSecurityScope: Bool
  private var isClosed = false
  private let lock = NSLock()  // non-reentrant. Don't use it in recursive calls

  init(file: FileSystemFile, mode: FileMode?) throws {
    // Callers that ask for a specific mode get exactly that mode checked. When no mode is given we
    // fall back to read-only on a path that is not writable, so opening a bundled file keeps working
    // without having to pass "r" from JavaScript. A path that permits neither still fails below.
    let resolvedMode = mode ?? (file.checkPermission(.write) ? FileMode.readWrite : FileMode.read)
    self.file = file
    self.mode = resolvedMode

    // Opening a handle hands out raw read/write access to the file, so it has to clear the same
    // permission check as every other read and write. Without this, JavaScript could open a file
    // belonging to another Expo Go experience, which the scoped permission service denies.
    for permission in resolvedMode.requiredPermissions {
      try file.validatePermission(permission)
    }

    self.didAccessSecurityScope = file.url.startAccessingSecurityScopedResource()

    do {
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
    } catch {
      if self.didAccessSecurityScope {
        file.url.stopAccessingSecurityScopedResource()
      }
      throw error
    }

    super.init(handle)
  }

  func read(_ length: Int) throws -> Data {
    lock.lock()
    defer {
      lock.unlock()
    }

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
    lock.lock()
    defer {
      lock.unlock()
    }

    if self.mode.readOnly {
      throw UnableToWriteHandleException("File opened read-only")
    }

    try handle.write(contentsOf: bytes)
  }

  override func sharedObjectDidRelease() {
    try? close()
  }

  func close() throws {
    lock.lock()
    defer {
      lock.unlock()
    }

    guard !isClosed else { return }
    isClosed = true
    defer {
      if didAccessSecurityScope {
        file.url.stopAccessingSecurityScopedResource()
      }
    }
    try handle.close()
  }

  var offset: UInt64? {
    get {
      lock.lock()
      defer {
        lock.unlock()
      }

      return try? handle.offset()
    }
    set(newOffset) {
      guard let newOffset else {
        return
      }

      lock.lock()
      defer {
        lock.unlock()
      }

      handle.seek(toFileOffset: newOffset)
    }
  }

  /// Size of the file via `fstat(2)`, or `nil` when the handle is closed or the call fails.
  var size: UInt64? {
    if isClosed {
      return nil
    }
    var status = stat()
    guard fstat(handle.fileDescriptor, &status) == 0 else {
      return nil
    }
    return UInt64(status.st_size)
  }

  private func ensureIsOpen() throws {
    if isClosed {
      throw UnableToReadHandleException("file handle is closed")
    }
  }

  /// Reads up to `length` bytes starting at `position` with `pread(2)`, which never touches the
  /// descriptor's own offset. The result is sized to the bytes actually read: shorter at the end of
  /// the file, empty at or past it. Safe to call from any thread.
  func readAt(_ position: UInt64, _ length: Int) throws -> ArrayBuffer {
    try ensureIsOpen()
    if mode.writeOnly {
      throw UnableToReadHandleException("File opened write-only")
    }

    let fileSize = size ?? 0
    let available = position < fileSize ? Int(clamping: fileSize - position) : 0
    let toRead = max(0, min(length, available))
    let buffer = ArrayBuffer(size: toRead, initializeToZero: false)
    if toRead == 0 {
      return buffer
    }

    var total = 0
    try buffer.withUnsafeMutableBytes { raw in
      guard let base = raw.baseAddress else {
        return
      }
      while total < toRead {
        let count = pread(handle.fileDescriptor, base + total, toRead - total, off_t(position) + off_t(total))
        if count < 0 {
          throw UnableToReadHandleException(String(cString: strerror(errno)))
        }
        if count == 0 {
          break
        }
        total += count
      }
    }
    if total == toRead {
      return buffer
    }
    // The file shrank between the size check and the read; hand back only what was read.
    return buffer.withUnsafeBytes { raw in
      guard let base = raw.baseAddress else {
        return ArrayBuffer(size: 0)
      }
      return ArrayBuffer.copy(of: base, count: total)
    }
  }

  /// Writes all of `data` at `position` with `pwrite(2)` and returns the offset right after the
  /// written bytes. In append mode the position is ignored and the data goes to the end of the file.
  /// Safe to call from any thread.
  func writeAt(_ position: UInt64, _ data: ArrayBuffer) throws -> UInt64 {
    try ensureIsOpen()
    if mode.readOnly {
      throw UnableToWriteHandleException("File opened read-only")
    }

    let start = mode == .append ? (size ?? 0) : position
    let length = data.byteLength
    var total = 0
    try data.withUnsafeBytes { raw in
      guard let base = raw.baseAddress else {
        return
      }
      while total < length {
        let count = pwrite(handle.fileDescriptor, base + total, length - total, off_t(start) + off_t(total))
        if count < 0 {
          throw UnableToWriteHandleException(String(cString: strerror(errno)))
        }
        total += count
      }
    }
    return start + UInt64(length)
  }
}

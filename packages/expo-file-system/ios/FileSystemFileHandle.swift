import Foundation
import ExpoModulesCore
import System

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

      if self.mode == FileMode.truncate {
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

  override func sharedObjectDidRelease() {
    try? close()
  }

  func close() throws {
    guard !isClosed else { return }
    isClosed = true
    defer {
      if didAccessSecurityScope {
        file.url.stopAccessingSecurityScopedResource()
      }
    }
    try handle.close()
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

    // Read the descriptor once: `FileHandle.fileDescriptor` raises an ObjC exception after close.
    let descriptor = FileDescriptor(rawValue: handle.fileDescriptor)
    let fileSize = size ?? 0
    let available = position < fileSize ? Int(clamping: fileSize - position) : 0
    let toRead = max(0, min(length, available))
    let buffer = ArrayBuffer(size: toRead, initializeToZero: false)
    if toRead == 0 {
      return buffer
    }

    var total = 0
    try buffer.withUnsafeMutableBytes { raw in
      while total < toRead {
        let count: Int
        do {
          count = try descriptor.read(
            fromAbsoluteOffset: Int64(position) + Int64(total),
            into: UnsafeMutableRawBufferPointer(rebasing: raw[total...])
          )
        } catch {
          throw UnableToReadHandleException(String(describing: error))
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

    let descriptor = FileDescriptor(rawValue: handle.fileDescriptor)
    let start = mode == .append ? (size ?? 0) : position
    let length = data.byteLength
    var total = 0
    try data.withUnsafeBytes { raw in
      while total < length {
        do {
          total += try descriptor.write(
            toAbsoluteOffset: Int64(start) + Int64(total),
            UnsafeRawBufferPointer(rebasing: raw[total...])
          )
        } catch {
          throw UnableToWriteHandleException(String(describing: error))
        }
      }
    }
    return start + UInt64(length)
  }
}

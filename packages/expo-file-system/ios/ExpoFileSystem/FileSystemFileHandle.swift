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

  var size: UInt64? {
    lock.lock()
    defer {
      lock.unlock()
    }

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

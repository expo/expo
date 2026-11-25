// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

internal enum DatabaseFileUtils {
  /// Files SQLite keeps next to the main database and that must travel with it.
  static let sidecarSuffixes = ["-journal", "-wal", "-shm"]

  private static let migrationLock = NSLock()

  /**
   Resolves the database path JavaScript sends into a `URL`. A `file:` URI is percent-encoded before
   `URL(string:)` so spaces, non-ASCII characters, `#` and `?` survive on every supported OS, and
   escapes that were already present stay as they are. A plain path goes through
   `URL(fileURLWithPath:)`, which never parses the string as a URL.
   */
  static func fileURL(fromDatabasePath path: String) -> URL? {
    guard path.hasPrefix("file:") else {
      return URL(fileURLWithPath: path)
    }
    var allowed = CharacterSet.urlPathAllowed
    allowed.insert(charactersIn: ":/")
    guard let encoded = path.addingPercentEncoding(withAllowedCharacters: allowed) else {
      return nil
    }
    // `%` is not path-allowed, so an input escape such as `%20` became `%2520`. Restore only escapes
    // followed by two hex digits; a bare `%` in a file name keeps its new `%25`.
    let restored = encoded.replacingOccurrences(
      of: "%25([0-9A-Fa-f]{2})",
      with: "%$1",
      options: .regularExpression
    )
    return URL(string: restored)
  }

  /**
   Returns the path earlier releases passed to SQLite, where `URL(string:)` percent-encoded the input
   on iOS 17 and later. Returns `nil` when it equals `resolvedPath` or is not just its encoded form,
   so a name truncated at `#` or `?` is left alone.
   */
  static func legacyEncodedPath(forDatabasePath path: String, resolvedPath: String) -> String? {
    guard let oldPath = URL(string: path)?.toFilePath() else {
      return nil
    }
    let legacyPath = URL(fileURLWithPath: oldPath).standardizedFileURL.path
    guard legacyPath != resolvedPath, legacyPath.removingPercentEncoding == resolvedPath else {
      return nil
    }
    return legacyPath
  }

  /**
   Moves a database left under its legacy percent-encoded name, with its sidecar files, to `path`.
   Sidecars move first so a crash leaves the database with its journal and the next open retries.
   */
  static func migrateLegacyDatabaseFiles(fromPath legacyPath: String, toPath path: String) throws {
    migrationLock.lock()
    defer { migrationLock.unlock() }

    let fileManager = FileManager.default
    let databaseExists = fileManager.fileExists(atPath: path)
    let legacyDatabaseExists = fileManager.fileExists(atPath: legacyPath)
    // With both databases present the legacy sidecars belong to the other one.
    guard databaseExists != legacyDatabaseExists else {
      return
    }

    for suffix in ["-journal", "-wal"] {
      let legacySidecar = legacyPath + suffix
      guard fileManager.fileExists(atPath: legacySidecar) else {
        continue
      }
      let sidecar = path + suffix
      if fileManager.fileExists(atPath: sidecar) {
        // The moved database already wrote its own; the stale legacy one is kept, not deleted.
        if databaseExists {
          continue
        }
        try fileManager.removeItem(atPath: sidecar)
      }
      try fileManager.moveItem(atPath: legacySidecar, toPath: sidecar)
    }

    try? fileManager.removeItem(atPath: legacyPath + "-shm")
    if databaseExists {
      return
    }
    try? fileManager.removeItem(atPath: path + "-shm")
    try fileManager.moveItem(atPath: legacyPath, toPath: path)
  }

  /**
   Deletes the database file at the given path together with its `-journal`, `-wal` and `-shm`
   sidecar files, mirroring the behavior of Android's `SQLiteDatabase.deleteDatabase()`.
   */
  static func deleteDatabaseFiles(atPath path: String) throws {
    let fileManager = FileManager.default
    if !fileManager.fileExists(atPath: path) {
      throw DatabaseNotFoundException(path)
    }

    do {
      try fileManager.removeItem(atPath: path)
    } catch {
      throw DeleteDatabaseFileException(path)
    }

    removeSidecarFiles(atPath: path)
  }

  /// Removes the database file and its sidecar files when present. Missing files are not an error.
  static func removeDatabaseFiles(atPath path: String) {
    if FileManager.default.fileExists(atPath: path) {
      try? FileManager.default.removeItem(atPath: path)
    }
    removeSidecarFiles(atPath: path)
  }

  private static func removeSidecarFiles(atPath path: String) {
    let fileManager = FileManager.default
    for suffix in sidecarSuffixes where fileManager.fileExists(atPath: path + suffix) {
      try? fileManager.removeItem(atPath: path + suffix)
    }
  }
}

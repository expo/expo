// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

internal enum DatabaseFileUtils {
  /// Files SQLite keeps next to the main database and that must travel with it.
  static let sidecarSuffixes = ["-journal", "-wal", "-shm"]

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
   Returns the path that earlier releases opened for a plain path on iOS 17 and later, where
   `URL(string:)` percent-encoded the string and the encoded form was used as the file name on disk.
   Returns `nil` for `file:` URIs, when the encoded form equals `resolvedPath`, or when the string
   does not parse (older OS versions threw there, so nothing was written).
   */
  static func legacyEncodedPath(forDatabasePath path: String, resolvedPath: String) -> String? {
    guard !path.hasPrefix("file:"),
      let legacyPath = URL(string: path)?.absoluteString,
      legacyPath != resolvedPath else {
      return nil
    }
    return legacyPath
  }

  /**
   Moves a database left under its legacy percent-encoded name, with its sidecar files, to `path`.
   Does nothing when `path` already exists or no legacy file is present.
   */
  static func migrateLegacyDatabaseFiles(fromPath legacyPath: String, toPath path: String) throws {
    let fileManager = FileManager.default
    guard !fileManager.fileExists(atPath: path), fileManager.fileExists(atPath: legacyPath) else {
      return
    }
    do {
      try fileManager.moveItem(atPath: legacyPath, toPath: path)
    } catch {
      // A concurrent caller may have finished the same move first.
      if !fileManager.fileExists(atPath: path) {
        throw error
      }
    }
    for suffix in sidecarSuffixes where fileManager.fileExists(atPath: legacyPath + suffix) {
      try? fileManager.moveItem(atPath: legacyPath + suffix, toPath: path + suffix)
    }
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

  /**
   Removes the database file and its sidecar files when present. Missing files are not an error, so
   this is safe to call before the first asset import.
   */
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

// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

internal enum DatabaseFileUtils {
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

    for suffix in ["-journal", "-wal", "-shm"] {
      let sidecarPath = path + suffix
      if fileManager.fileExists(atPath: sidecarPath) {
        try? fileManager.removeItem(atPath: sidecarPath)
      }
    }
  }
}

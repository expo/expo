// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation
import SQLite3

/**
 Owns a SQLite connection. All access must be serialized externally (we rely on `AppMetricsActor`).
 */
final class SQLiteDatabase {
  private var handle: OpaquePointer?

  var rawHandle: OpaquePointer {
    guard let handle else {
      preconditionFailure("SQLite database used after close")
    }
    return handle
  }

  init(fileUrl: URL) throws {
    try FileManager.default.createDirectory(
      at: fileUrl.deletingLastPathComponent(),
      withIntermediateDirectories: true
    )
    let flags = SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_FULLMUTEX
    let result = sqlite3_open_v2(fileUrl.path, &handle, flags, nil)
    if result != SQLITE_OK {
      let error = SQLiteError(db: handle, code: result)
      if let handle {
        sqlite3_close(handle)
      }
      handle = nil
      throw error
    }
    try execute("PRAGMA foreign_keys = ON")
    try execute("PRAGMA journal_mode = WAL")
  }

  deinit {
    if let handle {
      sqlite3_close_v2(handle)
    }
  }

  /**
   Closes the underlying connection. Idempotent — safe to call from cleanup paths that don't have a
   meaningful way to react to a close failure. Uses `sqlite3_close_v2` so any outstanding prepared
   statements zombie the handle instead of blocking the close.
   */
  func close() {
    guard let handle else {
      return
    }
    sqlite3_close_v2(handle)
    self.handle = nil
  }

  /**
   Executes one or more SQL statements with no parameters and no result rows.
   */
  func execute(_ sql: String) throws {
    var errorPointer: UnsafeMutablePointer<CChar>?
    let result = sqlite3_exec(rawHandle, sql, nil, nil, &errorPointer)
    if result != SQLITE_OK {
      let message = errorPointer.map { String(cString: $0) } ?? "unknown error"
      sqlite3_free(errorPointer)
      throw SQLiteError(code: result, message: message)
    }
  }

  /**
   Prepares a statement that can be bound and stepped by the caller.
   */
  func prepare(_ sql: String) throws -> SQLiteStatement {
    return try SQLiteStatement(db: rawHandle, sql: sql)
  }

  /**
   Runs `body` inside a transaction, rolling back if it throws.
   */
  func transaction<T>(_ body: () throws -> T) throws -> T {
    try execute("BEGIN")
    do {
      let value = try body()
      try execute("COMMIT")
      return value
    } catch {
      try? execute("ROLLBACK")
      throw error
    }
  }
}

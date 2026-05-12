// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation
import SQLite3

/**
 Owns a SQLite connection. The non-copyable shape encodes that the underlying C handle is an
 exclusive resource — there can never be two `SQLiteDatabase` values referring to the same open
 connection — so concurrent access via aliasing is impossible by construction. Callers still need
 to serialize access through some single owner (we use `AppMetricsActor`) because the C library's
 statement/transaction state is shared per-connection.
 */
struct SQLiteDatabase: ~Copyable, Sendable {
  // `nonisolated(unsafe)` lets the immutable handle cross isolation boundaries. The pointer itself
  // is `let`; concurrent access to what it points at is the caller's responsibility (we serialize
  // via `AppMetricsActor` — see the type's doc comment).
  nonisolated(unsafe) private let rawHandle: OpaquePointer

  init(fileUrl: URL) throws {
    try FileManager.default.createDirectory(
      at: fileUrl.deletingLastPathComponent(),
      withIntermediateDirectories: true
    )
    // `NOMUTEX` opens the connection in multi-thread mode (no per-connection mutex). Callers must
    // serialize access externally; in this module that's `AppMetricsActor`. Avoids the per-call
    // cost of `FULLMUTEX`'s serialized mode.
    let flags = SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_NOMUTEX
    var openedHandle: OpaquePointer?
    let result = sqlite3_open_v2(fileUrl.path, &openedHandle, flags, nil)
    guard result == SQLITE_OK, let openedHandle else {
      let error = SQLiteError(db: openedHandle, code: result)
      if let openedHandle {
        sqlite3_close_v2(openedHandle)
      }
      throw error
    }
    // Run startup PRAGMAs against the raw handle before binding it to `self`. If we assigned `self`
    // first and then threw, the non-copyable struct would be in a partially-initialized state that
    // Swift can't tear down — `deinit` only runs on fully-initialized values.
    do {
      try Self.execute("PRAGMA foreign_keys = ON", on: openedHandle)
      try Self.execute("PRAGMA journal_mode = WAL", on: openedHandle)
    } catch {
      sqlite3_close_v2(openedHandle)
      throw error
    }
    self.rawHandle = openedHandle
  }

  private static func execute(_ sql: String, on handle: OpaquePointer) throws {
    var errorPointer: UnsafeMutablePointer<CChar>?
    let result = sqlite3_exec(handle, sql, nil, nil, &errorPointer)
    if result != SQLITE_OK {
      let message = errorPointer.map { String(cString: $0) } ?? "unknown error"
      sqlite3_free(errorPointer)
      throw SQLiteError(code: result, message: message)
    }
  }

  deinit {
    sqlite3_close_v2(rawHandle)
  }

  /**
   Executes one or more SQL statements with no parameters and no result rows.
   */
  func execute(_ sql: String) throws {
    try Self.execute(sql, on: rawHandle)
  }

  /**
   Prepares a statement that can be bound and stepped by the caller.
   */
  func prepare(_ sql: String) throws -> SQLiteStatement {
    return try SQLiteStatement(db: rawHandle, sql: sql)
  }

  /**
   Returns the rowid of the most recent successful INSERT on this connection — the auto-increment
   `id` for tables with an `INTEGER PRIMARY KEY AUTOINCREMENT` column.
   */
  func lastInsertRowid() -> Int64 {
    return sqlite3_last_insert_rowid(rawHandle)
  }

  /**
   Runs `body` inside a transaction, rolling back if it throws. The original error always wins — a
   rollback failure is logged but does not replace the cause, since the cause is what the caller
   needs to diagnose the failed write. A failed rollback does mean the connection is left in an open
   transaction; the next `BEGIN` will report that, which is the right place to notice it.
   */
  func transaction<T>(_ body: () throws -> T) throws -> T {
    try execute("BEGIN")
    do {
      let value = try body()
      try execute("COMMIT")
      return value
    } catch {
      do {
        try execute("ROLLBACK")
      } catch let rollbackError {
        logger.warn("[AppMetrics] Failed to roll back transaction: \(rollbackError.localizedDescription)")
      }
      throw error
    }
  }
}

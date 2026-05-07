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
struct SQLiteDatabase: ~Copyable {
  let rawHandle: OpaquePointer

  init(fileUrl: URL) throws {
    try FileManager.default.createDirectory(
      at: fileUrl.deletingLastPathComponent(),
      withIntermediateDirectories: true
    )
    let flags = SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_FULLMUTEX
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

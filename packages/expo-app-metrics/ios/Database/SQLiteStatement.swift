// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation
import SQLite3

// SQLite expects this sentinel for parameters that need to be copied into its own buffers.
private let SQLITE_TRANSIENT = unsafeBitCast(OpaquePointer(bitPattern: -1), to: sqlite3_destructor_type.self)

/**
 A prepared SQLite statement. Reset and finalized automatically when the wrapper is destroyed.
 */
final class SQLiteStatement {
  private let db: OpaquePointer
  private var handle: OpaquePointer?

  init(db: OpaquePointer, sql: String) throws {
    self.db = db
    let result = sqlite3_prepare_v2(db, sql, -1, &handle, nil)
    if result != SQLITE_OK {
      throw SQLiteError(db: db, code: result)
    }
  }

  deinit {
    if let handle {
      sqlite3_finalize(handle)
    }
  }

  // MARK: - Bindings

  func bind(_ value: String?, at index: Int32) throws {
    let result: Int32
    if let value {
      result = sqlite3_bind_text(handle, index, value, -1, SQLITE_TRANSIENT)
    } else {
      result = sqlite3_bind_null(handle, index)
    }
    if result != SQLITE_OK {
      throw SQLiteError(db: db, code: result)
    }
  }

  func bind(_ value: Int64?, at index: Int32) throws {
    let result: Int32
    if let value {
      result = sqlite3_bind_int64(handle, index, value)
    } else {
      result = sqlite3_bind_null(handle, index)
    }
    if result != SQLITE_OK {
      throw SQLiteError(db: db, code: result)
    }
  }

  func bind(_ value: Int?, at index: Int32) throws {
    try bind(value.map { Int64($0) }, at: index)
  }

  func bind(_ value: Bool?, at index: Int32) throws {
    try bind(value.map { Int64($0 ? 1 : 0) }, at: index)
  }

  func bind(_ value: Double?, at index: Int32) throws {
    let result: Int32
    if let value {
      result = sqlite3_bind_double(handle, index, value)
    } else {
      result = sqlite3_bind_null(handle, index)
    }
    if result != SQLITE_OK {
      throw SQLiteError(db: db, code: result)
    }
  }

  /**
   Binds a sequence of values starting at index 1. Convenience for short, position-based queries.
   */
  func bindAll(_ values: [SQLiteBindable?]) throws {
    for (offset, value) in values.enumerated() {
      try value?.bind(to: self, at: Int32(offset + 1)) ?? bind(nil as String?, at: Int32(offset + 1))
    }
  }

  // MARK: - Execution

  /**
   Steps the statement to completion, ignoring any rows. Use for INSERT/UPDATE/DELETE.
   */
  func run() throws {
    let result = sqlite3_step(handle)
    if result != SQLITE_DONE && result != SQLITE_ROW {
      throw SQLiteError(db: db, code: result)
    }
  }

  /**
   Steps the statement and yields each row to the closure. Use for SELECT.
   */
  func forEachRow(_ body: (SQLiteRow) throws -> Void) throws {
    while true {
      let result = sqlite3_step(handle)
      switch result {
      case SQLITE_ROW:
        try body(SQLiteRow(handle: handle))
      case SQLITE_DONE:
        return
      default:
        throw SQLiteError(db: db, code: result)
      }
    }
  }
}

/**
 A type that can be bound as a SQLite parameter.
 */
protocol SQLiteBindable {
  func bind(to statement: SQLiteStatement, at index: Int32) throws
}

extension String: SQLiteBindable {
  func bind(to statement: SQLiteStatement, at index: Int32) throws {
    try statement.bind(self, at: index)
  }
}

extension Int: SQLiteBindable {
  func bind(to statement: SQLiteStatement, at index: Int32) throws {
    try statement.bind(self, at: index)
  }
}

extension Int64: SQLiteBindable {
  func bind(to statement: SQLiteStatement, at index: Int32) throws {
    try statement.bind(self, at: index)
  }
}

extension Bool: SQLiteBindable {
  func bind(to statement: SQLiteStatement, at index: Int32) throws {
    try statement.bind(self, at: index)
  }
}

extension Double: SQLiteBindable {
  func bind(to statement: SQLiteStatement, at index: Int32) throws {
    try statement.bind(self, at: index)
  }
}

/**
 Read-only view of one row of a stepped statement.
 */
struct SQLiteRow {
  let handle: OpaquePointer?

  func string(at column: Int32) -> String? {
    guard let cString = sqlite3_column_text(handle, column) else {
      return nil
    }
    return String(cString: cString)
  }

  func int(at column: Int32) -> Int? {
    if sqlite3_column_type(handle, column) == SQLITE_NULL {
      return nil
    }
    return Int(sqlite3_column_int64(handle, column))
  }

  func int64(at column: Int32) -> Int64? {
    if sqlite3_column_type(handle, column) == SQLITE_NULL {
      return nil
    }
    return sqlite3_column_int64(handle, column)
  }

  func bool(at column: Int32) -> Bool? {
    return int(at: column).map { $0 != 0 }
  }

  func double(at column: Int32) -> Double? {
    if sqlite3_column_type(handle, column) == SQLITE_NULL {
      return nil
    }
    return sqlite3_column_double(handle, column)
  }
}

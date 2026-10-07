// Copyright 2026-present 650 Industries. All rights reserved.

// Capture a statement's error while SQLite's recursive connection mutex still protects it.
// A different statement can otherwise replace both errcode and errmsg before we report the failure.
internal func sqliteErrorMessage(for db: OpaquePointer?, code: Int32) -> String {
  let message = String(cString: exsqlite3_errmsg(db), encoding: .utf8) ?? ""
  return "Error code \(code): \(message)"
}

internal func withSQLiteDatabaseLock<T>(for db: OpaquePointer?, _ operation: () throws -> T) rethrows -> T {
  let mutex = exsqlite3_db_mutex(db)
  exsqlite3_mutex_enter(mutex)
  defer { exsqlite3_mutex_leave(mutex) }
  return try operation()
}

internal func sqliteErrorMessage(for db: OpaquePointer?) -> String {
  return withSQLiteDatabaseLock(for: db) {
    return sqliteErrorMessage(for: db, code: exsqlite3_errcode(db))
  }
}

internal func sqliteResult(for db: OpaquePointer?, _ operation: () -> Int32) -> (code: Int32, message: String?) {
  return withSQLiteDatabaseLock(for: db) {
    let code = operation()
    guard code != SQLITE_OK && code != SQLITE_ROW && code != SQLITE_DONE else {
      return (code, nil)
    }
    return (code, sqliteErrorMessage(for: db, code: code))
  }
}

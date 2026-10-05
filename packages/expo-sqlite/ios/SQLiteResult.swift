// Copyright 2026-present 650 Industries. All rights reserved.

// Capture a statement's error while SQLite's recursive connection mutex still protects it.
// A different statement can otherwise replace both errcode and errmsg before we report the failure.
internal func sqliteResult(for db: OpaquePointer?, _ operation: () -> Int32) -> (code: Int32, message: String?) {
  let mutex = exsqlite3_db_mutex(db)
  exsqlite3_mutex_enter(mutex)
  defer { exsqlite3_mutex_leave(mutex) }
  let code = operation()
  guard code != SQLITE_OK && code != SQLITE_ROW && code != SQLITE_DONE else {
    return (code, nil)
  }
  return (code, "Error code \(code): \(String(cString: exsqlite3_errmsg(db)))")
}

// Copyright 2026-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoSQLite

@Suite("SQLite error reporting")
struct SQLiteErrorReportingTests {
  @Test
  func `captures the operation code and detail before another statement changes the connection error`() throws {
    var db: OpaquePointer?
    #expect(exsqlite3_open(":memory:", &db) == SQLITE_OK)
    defer { exsqlite3_close(db) }
    #expect(exsqlite3_exec(db, "CREATE TABLE item(id INTEGER PRIMARY KEY); INSERT INTO item VALUES (1)", nil, nil, nil) == SQLITE_OK)
    var statement: OpaquePointer?
    #expect(exsqlite3_prepare_v2(db, "INSERT INTO item VALUES (1)", -1, &statement, nil) == SQLITE_OK)
    let execution = sqliteResult(for: db) { exsqlite3_step(statement) }
    let cleanup = sqliteResult(for: db) { exsqlite3_finalize(statement) }
    #expect(exsqlite3_exec(db, "SELECT 1", nil, nil, nil) == SQLITE_OK)
    #expect(execution.code == SQLITE_CONSTRAINT)
    #expect(cleanup.code == SQLITE_CONSTRAINT)
    #expect(execution.message == "Error code 19: UNIQUE constraint failed: item.id")
    #expect(cleanup.message == execution.message)
  }
}

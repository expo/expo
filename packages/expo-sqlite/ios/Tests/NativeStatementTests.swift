// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Testing

@testable import ExpoSQLite

/// Exercises the statement members that `NativeStatement` exposes to JavaScript, against an in-memory
/// database. Statements are prepared through the C API so the tests stay independent of the database
/// members.
@Suite("NativeStatement")
@JavaScriptActor
final class NativeStatementTests {
  private let database: NativeDatabase

  init() throws {
    var pointer: OpaquePointer?
    #expect(exsqlite3_open(":memory:", &pointer) == SQLITE_OK)
    database = NativeDatabase(pointer, databasePath: ":memory:", openOptions: OpenDatabaseOptions())
    let setup = """
      CREATE TABLE test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL);
      INSERT INTO test (id, value) VALUES (1, 'one');
      INSERT INTO test (id, value) VALUES (2, 'two');
      """
    #expect(exsqlite3_exec(database.pointer, setup, nil, nil, nil) == SQLITE_OK)
  }

  deinit {
    exsqlite3_close(database.pointer)
  }

  private func prepare(_ source: String) -> NativeStatement {
    let statement = NativeStatement()
    #expect(exsqlite3_prepare_v2(database.pointer, source, -1, &statement.pointer, nil) == SQLITE_OK)
    return statement
  }

  @Test
  func `returns the column names of a prepared statement`() throws {
    let statement = prepare("SELECT id, value AS label FROM test")
    #expect(try statement.getColumnNamesSync() == ["id", "label"])
  }

  @Test
  func `reset rewinds a stepped statement to its first row`() throws {
    let statement = prepare("SELECT id FROM test ORDER BY id")
    #expect(exsqlite3_step(statement.pointer) == SQLITE_ROW)
    #expect(exsqlite3_step(statement.pointer) == SQLITE_ROW)
    #expect(exsqlite3_column_int(statement.pointer, 0) == 2)
    try statement.resetSync(database: database)
    #expect(exsqlite3_step(statement.pointer) == SQLITE_ROW)
    #expect(exsqlite3_column_int(statement.pointer, 0) == 1)
  }

  @Test
  func `finalize marks the statement finalized and rejects further use`() throws {
    let statement = prepare("SELECT id FROM test")
    try statement.finalizeSync(database: database)
    #expect(statement.isFinalized)
    #expect(throws: AccessClosedResourceException.self) {
      try statement.getColumnNamesSync()
    }
    #expect(throws: AccessClosedResourceException.self) {
      try statement.resetSync(database: database)
    }
    #expect(throws: AccessClosedResourceException.self) {
      try statement.finalizeSync(database: database)
    }
  }

  @Test
  func `throws when the database is closed`() throws {
    let statement = prepare("SELECT id FROM test")
    database.isClosed = true
    #expect(throws: AccessClosedResourceException.self) {
      try statement.resetSync(database: database)
    }
    database.isClosed = false
    exsqlite3_finalize(statement.pointer)
  }

  @Test
  func `async members run the same operations`() async throws {
    let statement = prepare("SELECT id, value FROM test")
    #expect(try await statement.getColumnNamesAsync() == ["id", "value"])
    try await statement.resetAsync(database: database)
    try await statement.finalizeAsync(database: database)
    #expect(statement.isFinalized)
  }
}

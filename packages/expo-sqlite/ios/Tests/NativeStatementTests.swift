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

  @Test
  func `run binds positional parameters and reports the changes`() throws {
    let statement = prepare("INSERT INTO test (id, value) VALUES (?, ?)")
    let result = try statement.runSync(
      database: database,
      bindParams: ["0": .double(3), "1": .text("three")],
      bindBlobParams: [:],
      shouldPassAsArray: true
    )
    #expect(result.lastInsertRowId == 3)
    #expect(result.changes == 1)
    #expect(result.firstRowValues.isEmpty)
    #expect(selectValue(id: 3) == "three")
  }

  @Test
  func `run binds named parameters`() throws {
    let statement = prepare("INSERT INTO test (id, value) VALUES ($id, $value)")
    _ = try statement.runSync(
      database: database,
      bindParams: ["$id": .double(4), "$value": .text("four")],
      bindBlobParams: [:],
      shouldPassAsArray: false
    )
    #expect(selectValue(id: 4) == "four")
  }

  @Test
  func `run returns the values of the first row`() throws {
    let statement = prepare("SELECT id, value FROM test WHERE id = ?")
    let result = try statement.runSync(
      database: database,
      bindParams: ["0": .double(2)],
      bindBlobParams: [:],
      shouldPassAsArray: true
    )
    #expect(result.firstRowValues == [.integer(2), .text("two")])
  }

  @Test
  func `run binds blob and null parameters`() throws {
    let statement = prepare("SELECT ?, ?, typeof(?)")
    let bytes: [UInt8] = [1, 2, 3]
    let result = try statement.runSync(
      database: database,
      bindParams: ["1": .null, "2": .null],
      bindBlobParams: ["0": ArrayBuffer.copy(of: bytes, count: bytes.count)],
      shouldPassAsArray: true
    )
    #expect(result.firstRowValues.count == 3)
    #expect(blobBytes(result.firstRowValues[0]) == [1, 2, 3])
    #expect(result.firstRowValues[1] == .null)
    #expect(result.firstRowValues[2] == .text("null"))
  }

  @Test
  func `step returns one row at a time and nil once done`() throws {
    let statement = prepare("SELECT id FROM test ORDER BY id")
    #expect(try statement.stepSync(database: database) == [.integer(1)])
    #expect(try statement.stepSync(database: database) == [.integer(2)])
    #expect(try statement.stepSync(database: database) == nil)
  }

  @Test
  func `getAll returns every row with each storage class`() throws {
    let statement = prepare("SELECT id, value, 1.5, NULL FROM test ORDER BY id")
    let rows = try statement.getAllSync(database: database)
    #expect(rows == [
      [.integer(1), .text("one"), .double(1.5), .null],
      [.integer(2), .text("two"), .double(1.5), .null]
    ])
  }

  @Test
  func `run, step and getAll throw once the statement is finalized`() throws {
    let statement = prepare("SELECT id FROM test")
    try statement.finalizeSync(database: database)
    #expect(throws: AccessClosedResourceException.self) {
      try statement.runSync(database: database, bindParams: [:], bindBlobParams: [:], shouldPassAsArray: true)
    }
    #expect(throws: AccessClosedResourceException.self) {
      try statement.stepSync(database: database)
    }
    #expect(throws: AccessClosedResourceException.self) {
      try statement.getAllSync(database: database)
    }
  }

  @Test
  func `async run, step and getAll run the same operations`() async throws {
    let statement = prepare("SELECT id FROM test WHERE id >= ? ORDER BY id")
    let result = try await statement.runAsync(
      database: database,
      bindParams: ["0": .double(1)],
      bindBlobParams: [:],
      shouldPassAsArray: true
    )
    #expect(result.firstRowValues == [.integer(1)])
    #expect(try await statement.stepAsync(database: database) == [.integer(2)])
    #expect(try await statement.stepAsync(database: database) == nil)
    try statement.resetSync(database: database)
    #expect(try await statement.getAllAsync(database: database) == [[.integer(1)], [.integer(2)]])
  }

  private func selectValue(id: Int32) -> String? {
    var statement: OpaquePointer?
    exsqlite3_prepare_v2(database.pointer, "SELECT value FROM test WHERE id = ?", -1, &statement, nil)
    defer { exsqlite3_finalize(statement) }
    exsqlite3_bind_int(statement, 1, id)
    guard exsqlite3_step(statement) == SQLITE_ROW, let text = exsqlite3_column_text(statement, 0) else {
      return nil
    }
    return String(cString: text)
  }

  private func blobBytes(_ value: SQLiteValue) -> [UInt8]? {
    guard case .blob(let buffer) = value else {
      return nil
    }
    return buffer.withUnsafeBytes { Array($0) }
  }
}

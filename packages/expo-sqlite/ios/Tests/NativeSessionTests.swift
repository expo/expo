// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Testing

@testable import ExpoSQLite

/// Exercises the session members that `NativeSession` exposes to JavaScript, against an in-memory
/// database. The session itself is created through the C API so the tests stay independent of the
/// database members.
@Suite("NativeSession")
@JavaScriptActor
final class NativeSessionTests {
  private let database: NativeDatabase
  private let session = NativeSession()

  init() throws {
    var pointer: OpaquePointer?
    #expect(exsqlite3_open(":memory:", &pointer) == SQLITE_OK)
    database = NativeDatabase(pointer, databasePath: ":memory:", openOptions: OpenDatabaseOptions())
    let setup = "CREATE TABLE test (id INTEGER PRIMARY KEY NOT NULL, value TEXT NOT NULL);"
    #expect(exsqlite3_exec(database.pointer, setup, nil, nil, nil) == SQLITE_OK)
    #expect(exsqlite3session_create(database.pointer, "main", &session.pointer) == SQLITE_OK)
  }

  deinit {
    exsqlite3_close(database.pointer)
  }

  private func execute(_ sql: String) {
    #expect(exsqlite3_exec(database.pointer, sql, nil, nil, nil) == SQLITE_OK)
  }

  private func rowCount() -> Int32 {
    var statement: OpaquePointer?
    #expect(exsqlite3_prepare_v2(database.pointer, "SELECT COUNT(*) FROM test", -1, &statement, nil) == SQLITE_OK)
    defer {
      exsqlite3_finalize(statement)
    }
    #expect(exsqlite3_step(statement) == SQLITE_ROW)
    return exsqlite3_column_int(statement, 0)
  }

  @Test
  func `records attached table changes into a changeset`() throws {
    try session.attachSync(database: database, table: "test")
    execute("INSERT INTO test (id, value) VALUES (1, 'one')")
    let changeset = try session.createChangesetSync(database: database)
    #expect(changeset.byteLength > 0)
  }

  @Test
  func `records nothing while the session is disabled`() throws {
    try session.attachSync(database: database, table: nil)
    try session.enableSync(database: database, enabled: false)
    execute("INSERT INTO test (id, value) VALUES (1, 'one')")
    let changeset = try session.createChangesetSync(database: database)
    #expect(changeset.byteLength == 0)
  }

  @Test
  func `applying the inverted changeset reverts the recorded changes`() throws {
    try session.attachSync(database: database, table: nil)
    execute("INSERT INTO test (id, value) VALUES (1, 'one')")
    #expect(rowCount() == 1)
    let inverted = try session.createInvertedChangesetSync(database: database)
    try session.applyChangesetSync(database: database, changeset: inverted)
    #expect(rowCount() == 0)
  }

  @Test
  func `inverting a changeset twice yields the original`() throws {
    try session.attachSync(database: database, table: nil)
    execute("INSERT INTO test (id, value) VALUES (1, 'one')")
    let changeset = try session.createChangesetSync(database: database)
    let inverted = try session.invertChangesetSync(database: database, changeset: changeset)
    let restored = try session.invertChangesetSync(database: database, changeset: inverted)
    #expect(restored.byteLength == changeset.byteLength)
    #expect(inverted.byteLength == changeset.byteLength)
  }

  @Test
  func `throws when the database is closed`() throws {
    database.isClosed = true
    #expect(throws: AccessClosedResourceException.self) {
      try session.attachSync(database: database, table: nil)
    }
    #expect(throws: AccessClosedResourceException.self) {
      try session.createChangesetSync(database: database)
    }
    database.isClosed = false
  }

  @Test
  func `async members run the same operations`() async throws {
    try await session.attachAsync(database: database, table: nil)
    execute("INSERT INTO test (id, value) VALUES (1, 'one')")
    let changeset = try await session.createChangesetAsync(database: database)
    #expect(changeset.byteLength > 0)
    try await session.closeAsync(database: database)
  }
}

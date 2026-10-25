// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Testing

@testable import ExpoSQLite

/// Exercises the connection members that `NativeDatabase` exposes to JavaScript, against an in-memory
/// database opened through the C API.
@Suite("NativeDatabase")
@JavaScriptActor
final class NativeDatabaseTests {
  private let database: NativeDatabase

  init() throws {
    var pointer: OpaquePointer?
    #expect(exsqlite3_open(":memory:", &pointer) == SQLITE_OK)
    database = NativeDatabase(pointer, databasePath: ":memory:", openOptions: OpenDatabaseOptions())
  }

  deinit {
    exsqlite3_close(database.pointer)
  }

  @Test
  func `exec runs the given statements`() throws {
    try database.execSync(source: "CREATE TABLE test (id INTEGER PRIMARY KEY NOT NULL); INSERT INTO test (id) VALUES (1);")
    let statement = NativeStatement()
    try database.prepareSync(statement: statement, source: "SELECT COUNT(*) FROM test")
    #expect(exsqlite3_step(statement.pointer) == SQLITE_ROW)
    #expect(exsqlite3_column_int(statement.pointer, 0) == 1)
    exsqlite3_finalize(statement.pointer)
  }

  @Test
  func `exec surfaces SQLite errors`() {
    #expect(throws: SQLiteErrorException.self) {
      try database.execSync(source: "NOT VALID SQL")
    }
  }

  @Test
  func `prepare rejects a finalized statement`() throws {
    let statement = NativeStatement()
    statement.isFinalized = true
    #expect(throws: AccessClosedResourceException.self) {
      try database.prepareSync(statement: statement, source: "SELECT 1")
    }
  }

  @Test
  func `reports whether a transaction is open`() throws {
    #expect(try database.isInTransactionSync() == false)
    try database.execSync(source: "BEGIN")
    #expect(try database.isInTransactionSync() == true)
    try database.execSync(source: "COMMIT")
    #expect(try database.isInTransactionSync() == false)
  }

  @Test
  func `serialize returns the database file image`() throws {
    try database.execSync(source: "CREATE TABLE test (id INTEGER PRIMARY KEY NOT NULL)")
    let data = try database.serializeSync(databaseName: "main")
    #expect(String(decoding: data.prefix(15), as: UTF8.self) == "SQLite format 3")
  }

  @Test
  func `creates a session bound to the database`() throws {
    try database.execSync(source: "CREATE TABLE test (id INTEGER PRIMARY KEY NOT NULL)")
    let session = NativeSession()
    try database.createSessionSync(session: session, dbName: "main")
    #expect(session.pointer != nil)
    exsqlite3session_delete(session.pointer)
  }

  @Test
  func `loading a missing extension throws`() {
    #expect(throws: SQLiteErrorException.self) {
      try database.loadExtensionSync(libPath: "/nonexistent/extension", entryPoint: nil)
    }
  }

  @Test
  func `throws when the database is closed`() throws {
    database.isClosed = true
    #expect(throws: AccessClosedResourceException.self) {
      try database.execSync(source: "SELECT 1")
    }
    #expect(throws: AccessClosedResourceException.self) {
      try database.isInTransactionSync()
    }
    #expect(throws: AccessClosedResourceException.self) {
      try database.serializeSync(databaseName: "main")
    }
    database.isClosed = false
  }

  @Test
  func `async members run the same operations`() async throws {
    try await database.execAsync(source: "CREATE TABLE test (id INTEGER PRIMARY KEY NOT NULL)")
    #expect(try await database.isInTransactionAsync() == false)
    let data = try await database.serializeAsync(databaseName: "main")
    #expect(data.count > 0)
  }
}

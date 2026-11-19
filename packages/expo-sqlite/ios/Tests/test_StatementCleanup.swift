// Copyright 2026-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore
@testable import ExpoSQLite

@Suite("Statement cleanup")
struct StatementCleanupTests {
  @Test
  @JavaScriptActor
  func `failed close invalidates cleaned up statements and permits retry`() throws {
    let appContext = AppContext.create()
    let module = SQLiteModule(appContext: appContext)
    var pointer: OpaquePointer?
    var destination: OpaquePointer?
    #expect(exsqlite3_open(":memory:", &pointer) == SQLITE_OK)
    #expect(exsqlite3_open(":memory:", &destination) == SQLITE_OK)
    let database = NativeDatabase(pointer, databasePath: ":memory:", openOptions: OpenDatabaseOptions())
    defer {
      if !database.isClosed { try? module.closeDatabase(database) }
      exsqlite3_close(destination)
    }

    let statement = NativeStatement()
    try database.prepareSync(statement: statement, source: "SELECT 42 AS value")

    // A pending backup keeps the source connection busy even after every statement is finalized.
    // This reproduces a failed close after cleanup without depending on a thread race.
    let backup = try #require(exsqlite3_backup_init(destination, "main", pointer, "main"))
    do {
      defer { exsqlite3_backup_finish(backup) }
      #expect(throws: SQLiteErrorException.self) { try module.closeDatabase(database) }
      #expect(!database.isClosed)
      try #require(statement.isFinalized)
      #expect(throws: AccessClosedResourceException.self) { try statement.getColumnNamesSync() }
      #expect(throws: AccessClosedResourceException.self) {
        try statement.finalizeSync(database: database)
      }

      let fresh = NativeStatement()
      try database.prepareSync(statement: fresh, source: "SELECT 1 AS fresh")
      #expect(try fresh.getColumnNamesSync() == ["fresh"])
      try fresh.finalizeSync(database: database)
    }
    try module.closeDatabase(database)
    #expect(database.isClosed)
  }

  @Test
  func `preparing during close either gets cleaned up or rejects the closed database`() async throws {
    let appContext = AppContext.create()
    let module = SQLiteModule(appContext: appContext)
    for _ in 0..<50 {
      var pointer: OpaquePointer?
      #expect(exsqlite3_open(":memory:", &pointer) == SQLITE_OK)
      let database = NativeDatabase(pointer, databasePath: ":memory:", openOptions: OpenDatabaseOptions())
      defer {
        if !database.isClosed { try? module.closeDatabase(database) }
      }
      let statement = NativeStatement()
      await withTaskGroup(of: Void.self) { group in
        for index in 0..<2 {
          group.addTask {
            do {
              if index == 0 {
                try await database.prepareAsync(statement: statement, source: "SELECT 1")
              } else {
                try module.closeDatabase(database)
              }
            } catch is AccessClosedResourceException {
              #expect(index == 0)
            } catch {
              Issue.record(error)
            }
          }
        }
      }
      #expect(database.isClosed)
      // A prepared statement must have been invalidated by cleanup.
      #expect(statement.pointer == nil)
    }
  }

  @Test
  @JavaScriptActor
  func `run, step and getAll reject a statement that a failed close finalized`() throws {
    let appContext = AppContext.create()
    let module = SQLiteModule(appContext: appContext)
    var pointer: OpaquePointer?
    var destination: OpaquePointer?
    #expect(exsqlite3_open(":memory:", &pointer) == SQLITE_OK)
    #expect(exsqlite3_open(":memory:", &destination) == SQLITE_OK)
    let database = NativeDatabase(pointer, databasePath: ":memory:", openOptions: OpenDatabaseOptions())
    defer {
      if !database.isClosed { try? module.closeDatabase(database) }
      exsqlite3_close(destination)
    }

    let statement = NativeStatement()
    try database.prepareSync(statement: statement, source: "SELECT ? AS value")

    // The pending backup makes the close fail after it has finalized the statement, as above.
    let backup = try #require(exsqlite3_backup_init(destination, "main", pointer, "main"))
    defer { exsqlite3_backup_finish(backup) }
    #expect(throws: SQLiteErrorException.self) { try module.closeDatabase(database) }
    try #require(statement.isFinalized)
    #expect(statement.pointer == nil)

    #expect(throws: AccessClosedResourceException.self) {
      try statement.runSync(database: database, bindParams: ["0": .double(1)], bindBlobParams: [:], shouldPassAsArray: true)
    }
    #expect(throws: AccessClosedResourceException.self) { try statement.stepSync(database: database) }
    #expect(throws: AccessClosedResourceException.self) { try statement.getAllSync(database: database) }
  }

  @Test
  func `getAll during close either reads the rows or rejects the finalized statement`() async throws {
    let appContext = AppContext.create()
    let module = SQLiteModule(appContext: appContext)
    for _ in 0..<50 {
      var pointer: OpaquePointer?
      #expect(exsqlite3_open(":memory:", &pointer) == SQLITE_OK)
      let database = NativeDatabase(pointer, databasePath: ":memory:", openOptions: OpenDatabaseOptions())
      defer {
        if !database.isClosed { try? module.closeDatabase(database) }
      }
      let statement = NativeStatement()
      try await database.prepareAsync(statement: statement, source: "SELECT 1 AS value UNION ALL SELECT 2")
      await withTaskGroup(of: Void.self) { group in
        group.addTask {
          do {
            let rows = try await statement.getAllAsync(database: database)
            #expect(rows == [[.double(1)], [.double(2)]])
          } catch is AccessClosedResourceException {
            // Close finalized the statement first.
          } catch {
            Issue.record(error)
          }
        }
        group.addTask {
          do {
            try module.closeDatabase(database)
          } catch {
            Issue.record(error)
          }
        }
      }
      #expect(database.isClosed)
      #expect(statement.isFinalized)
    }
  }
}

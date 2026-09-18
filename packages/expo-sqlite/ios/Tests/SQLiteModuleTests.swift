// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Testing

@testable import ExpoSQLite

/// Exercises the module-level surface: the constants JavaScript reads, the change-event payload shape
/// and the listener bookkeeping behind the update hook.
@Suite("SQLiteModule")
@JavaScriptActor
struct SQLiteModuleTests {
  private let appContext = AppContext()
  private let module: SQLiteModule

  init() {
    module = SQLiteModule(appContext: appContext)
  }

  @Test
  func `default database directory is the SQLite folder of the app's documents`() {
    #if os(tvOS)
    let baseDirectory = appContext.config.cacheDirectory
    #else
    let baseDirectory = appContext.config.documentDirectory
    #endif
    let expected = baseDirectory?.appendingPathComponent("SQLite").standardized.path
    #expect(module.defaultDatabaseDirectory == expected)
    #expect(module.defaultDatabaseDirectory?.hasSuffix("/SQLite") == true)
  }

  @Test
  func `bundles no extensions unless the build enables them`() {
    #if WITH_SQLITE_VEC
    #expect(module.bundledExtensions.keys.sorted() == ["sqlite-vec"])
    #else
    #expect(module.bundledExtensions.isEmpty)
    #endif
  }

  @Test
  func `tracks whether JavaScript listens for database changes`() {
    #expect(module.hasListeners == false)
    module.didStartListening(event: "onDatabaseChange")
    #expect(module.hasListeners == true)
    module.didStopListening(event: "onDatabaseChange")
    #expect(module.hasListeners == false)
  }

  @Test
  func `database change event carries the fields JavaScript reads`() {
    let event = DatabaseChangeEvent(
      databaseName: "main",
      databaseFilePath: "/tmp/test.db",
      tableName: "test",
      rowId: 3,
      typeId: .insert
    )
    let dictionary = event.toDictionary(appContext: appContext)
    #expect(dictionary.keys.sorted() == ["databaseFilePath", "databaseName", "rowId", "tableName", "typeId"])
    #expect(dictionary["databaseName"] as? String == "main")
    #expect(dictionary["tableName"] as? String == "test")
  }

  @Test
  func `ensuring the in-memory database path needs no file system`() throws {
    try module.ensureDatabasePathExistsSync(databasePath: ":memory:")
  }

  @Test
  func `ensuring a file database path creates its directory`() throws {
    let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    defer {
      try? FileManager.default.removeItem(at: directory)
    }
    try module.ensureDatabasePathExistsSync(databasePath: directory.appendingPathComponent("test.db").path)
    #expect(FileManager.default.fileExists(atPath: directory.path))
  }

  @Test
  func `deleting the in-memory database does nothing`() throws {
    try module.deleteDatabaseSync(databasePath: ":memory:")
  }

  @Test
  func `backs up one database into another`() throws {
    var sourcePointer: OpaquePointer?
    var destinationPointer: OpaquePointer?
    #expect(exsqlite3_open(":memory:", &sourcePointer) == SQLITE_OK)
    #expect(exsqlite3_open(":memory:", &destinationPointer) == SQLITE_OK)
    defer {
      exsqlite3_close(sourcePointer)
      exsqlite3_close(destinationPointer)
    }
    let source = NativeDatabase(sourcePointer, databasePath: ":memory:", openOptions: OpenDatabaseOptions())
    let destination = NativeDatabase(destinationPointer, databasePath: ":memory:", openOptions: OpenDatabaseOptions())
    try source.execSync(source: "CREATE TABLE test (id INTEGER PRIMARY KEY NOT NULL); INSERT INTO test (id) VALUES (7);")
    try module.backupDatabaseSync(
      destDatabase: destination,
      destDatabaseName: "main",
      sourceDatabase: source,
      sourceDatabaseName: "main"
    )
    let statement = NativeStatement()
    try destination.prepareSync(statement: statement, source: "SELECT id FROM test")
    #expect(exsqlite3_step(statement.pointer) == SQLITE_ROW)
    #expect(exsqlite3_column_int(statement.pointer, 0) == 7)
    exsqlite3_finalize(statement.pointer)
  }

  @Test
  func `async members run the same operations`() async throws {
    try await module.ensureDatabasePathExistsAsync(databasePath: ":memory:")
    try await module.deleteDatabaseAsync(databasePath: ":memory:")
  }
}

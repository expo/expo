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
}

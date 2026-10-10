// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore
@testable import ExpoSQLite

/// Opens, initializes, interrupts and closes connections from JavaScript, through the module's
/// `createNativeDatabase` factory and the `NativeDatabase` members.
@Suite("NativeDatabase from JavaScript")
@JavaScriptActor
struct NativeDatabaseJavaScriptTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(
      holder: ModuleHolder(appContext: appContext, module: SQLiteModule(appContext: appContext), name: "ExpoSQLite")
    )
    _ = try runtime.eval("var SQLite = expo.modules.ExpoSQLite;")
  }

  @Test
  func `factory returns the cached connection for the same path and options`() throws {
    let result = try runtime.eval(
      """
      (function () {
        var first = SQLite.createNativeDatabase(':memory:', {});
        first.initSync();
        var second = SQLite.createNativeDatabase(':memory:', {});
        second.initSync();
        return JSON.stringify({
          same: first === second,
          isNativeDatabase: first instanceof SQLite.NativeDatabase,
        });
      })()
      """
    )
    #expect(try result.asString() == #"{"same":true,"isNativeDatabase":true}"#)
  }

  @Test
  func `factory opens a new connection when asked to`() throws {
    let result = try runtime.eval(
      """
      (function () {
        var first = SQLite.createNativeDatabase(':memory:', {});
        var second = SQLite.createNativeDatabase(':memory:', { useNewConnection: true });
        return first === second;
      })()
      """
    )
    #expect(try result.asBool() == false)
  }

  @Test
  func `factory deserializes a database`() throws {
    let result = try runtime.eval(
      """
      (function () {
        var source = SQLite.createNativeDatabase(':memory:', { useNewConnection: true });
        source.initSync();
        source.execSync("CREATE TABLE t (value TEXT); INSERT INTO t VALUES ('restored')");
        var copy = SQLite.createNativeDatabase(':memory:', {}, source.serializeSync('main'));
        copy.initSync();
        var statement = new SQLite.NativeStatement();
        copy.prepareSync(statement, 'SELECT value FROM t');
        return statement.getAllSync(copy)[0][0];
      })()
      """
    )
    #expect(try result.asString() == "restored")
  }

  @Test
  func `close releases one reference to a cached connection`() throws {
    let result = try runtime.eval(
      """
      (function () {
        var first = SQLite.createNativeDatabase(':memory:', {});
        first.initSync();
        var second = SQLite.createNativeDatabase(':memory:', {});
        second.initSync();
        second.closeSync();
        first.execSync('SELECT 1');
        first.closeSync();
        try {
          first.execSync('SELECT 1');
          return 'still open';
        } catch (error) {
          return error.message;
        }
      })()
      """
    )
    #expect(try result.asString().contains("Access to closed resource"))
  }

  @Test
  func `async init and close settle off the JavaScript thread`() async throws {
    let result = try await runtime.evalAsync(
      """
      (function () {
        var db = SQLite.createNativeDatabase(':memory:', { useNewConnection: true });
        return db.initAsync()
          .then(function () { return db.closeAsync(); })
          .then(function () {
            try {
              db.execSync('SELECT 1');
              return 'still open';
            } catch (error) {
              return error.message;
            }
          });
      })()
      """
    )
    #expect(try await result.asString().contains("Access to closed resource"))
  }

  @Test
  func `interrupt rejects a closed database`() throws {
    let result = try runtime.eval(
      """
      (function () {
        var db = SQLite.createNativeDatabase(':memory:', { useNewConnection: true });
        db.initSync();
        db.interruptSync();
        db.closeSync();
        try {
          db.interruptSync();
          return 'interrupted';
        } catch (error) {
          return error.message;
        }
      })()
      """
    )
    #expect(try result.asString().contains("Access to closed resource"))
  }
}

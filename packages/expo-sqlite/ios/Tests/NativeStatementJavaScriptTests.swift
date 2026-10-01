// Copyright 2015-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore
@testable import ExpoSQLite

/// Calls the statement members from JavaScript, so the bind parameters and the column values go
/// through the `SQLiteBindValue` and `SQLiteColumnValue` conversions and the result has the shape `src/` reads.
@Suite("NativeStatement from JavaScript")
@JavaScriptActor
struct NativeStatementJavaScriptTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = AppContext.create()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(
      holder: ModuleHolder(appContext: appContext, module: SQLiteModule(appContext: appContext), name: "ExpoSQLite")
    )
    _ = try runtime.eval(
      """
      var NativeStatement = expo.modules.ExpoSQLite.NativeStatement;
      var db = new expo.modules.ExpoSQLite.NativeDatabase(':memory:', { useNewConnection: true });
      db.initSync();
      db.execSync('CREATE TABLE t (id INTEGER PRIMARY KEY NOT NULL, value TEXT)');
      function prepare(source) {
        var statement = new NativeStatement();
        db.prepareSync(statement, source);
        return statement;
      }
      """
    )
  }

  @Test
  func `run decodes each parameter type and encodes each column type`() throws {
    let result = try runtime.eval(
      """
      (function () {
        var statement = prepare('SELECT ?, ?, ?, ?, ?, typeof(?), ?');
        var result = statement.runSync(db, { 0: 7, 1: 1.5, 2: 'text', 3: true, 4: null, 5: 7 }, { 6: new Uint8Array([1, 2, 3]) }, true);
        var values = result.firstRowValues;
        return JSON.stringify({
          values: values.slice(0, 6),
          blobIsArrayBuffer: values[6] instanceof ArrayBuffer,
          blob: Array.from(new Uint8Array(values[6])),
        });
      })()
      """
    )
    // Numbers bind as doubles, as they did through the type-erased path, so `typeof` reports `real`.
    #expect(try result.asString() == #"{"values":[7,1.5,"text",1,null,"real"],"blobIsArrayBuffer":true,"blob":[1,2,3]}"#)
  }

  @Test
  func `run reports the last insert row id and the changes`() throws {
    let result = try runtime.eval(
      """
      (function () {
        var statement = prepare('INSERT INTO t (id, value) VALUES ($id, $value)');
        var result = statement.runSync(db, { $id: 42, $value: 'answer' }, {}, false);
        return JSON.stringify([result.lastInsertRowId, result.changes, result.firstRowValues]);
      })()
      """
    )
    #expect(try result.asString() == "[42,1,[]]")
  }

  @Test
  func `step and getAll return rows of column values`() throws {
    let result = try runtime.eval(
      """
      (function () {
        db.execSync("INSERT INTO t (id, value) VALUES (1, 'one'), (2, NULL)");
        var statement = prepare('SELECT id, value FROM t ORDER BY id');
        var stepped = [statement.stepSync(db), statement.stepSync(db), statement.stepSync(db)];
        statement.resetSync(db);
        return JSON.stringify({ stepped: stepped, all: statement.getAllSync(db) });
      })()
      """
    )
    #expect(try result.asString() == #"{"stepped":[[1,"one"],[2,null],null],"all":[[1,"one"],[2,null]]}"#)
  }

  @Test
  func `run binds a bigint as an integer`() throws {
    let result = try runtime.eval(
      """
      (function () {
        var result = prepare('SELECT ?, typeof(?)').runSync(db, { 0: 9007199254740993n, 1: 7n }, {}, true);
        return JSON.stringify(result.firstRowValues);
      })()
      """
    )
    // The column comes back as a number, like every integer column, so it loses precision above 2^53.
    #expect(try result.asString() == #"[9007199254740992,"integer"]"#)
  }

  @Test
  func `run rejects a parameter of an unsupported type`() throws {
    #expect(throws: (any Error).self) {
      try runtime.eval("prepare('SELECT ?').runSync(db, { 0: Symbol('nope') }, {}, true)")
    }
  }
}

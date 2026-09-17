// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore
@testable import ExpoSQLite

/// End-to-end benchmarks for JavaScript calling the native module. A JavaScript driver function runs
/// the measured loop against `expo.modules.ExpoSQLite`, so each operation covers the full round trip:
/// the engine's call dispatch, argument decoding, the SQLite work and encoding the result back.
///
/// The drivers issue the same sequence of native calls that `SQLiteDatabase` in `src/` issues for the
/// corresponding public method, so a change to the native binding shows up here the way it shows up
/// for an app. Read every result against `JS: empty driver loop`.
extension Benchmarks {
  /// Evaluates the setup script: opens a seeded in-memory database as the global `db` and exposes the
  /// statement class as `NativeStatement`, then returns the runtime for the drivers.
  @JavaScriptActor
  private func prepareRuntime(_ appContext: AppContext) throws -> JavaScriptRuntime {
    let runtime = try appContext.runtime
    let schema = BenchmarkSchema.setup()
      .replacingOccurrences(of: "\\", with: "\\\\")
      .replacingOccurrences(of: "`", with: "\\`")
    _ = try runtime.eval(
      """
      var NativeStatement = expo.modules.ExpoSQLite.NativeStatement;
      var db = new expo.modules.ExpoSQLite.NativeDatabase(':memory:', { useNewConnection: true });
      db.initSync();
      db.execSync(`\(schema)`);
      """
    )
    return runtime
  }

  /// A driver that runs `body` `n` times; `body` sees `db`, `NativeStatement` and the loop index `i`.
  @JavaScriptActor
  private func driver(_ runtime: JavaScriptRuntime, _ body: String) throws -> JavaScriptFunction {
    return try runtime.eval("(function(n) { for (var i = 0; i < n; i++) { \(body) } })").getFunction()
  }

  /// The native calls behind `SQLiteDatabase.getAllSync(source)`.
  @JavaScriptActor
  private func getAllDriver(_ runtime: JavaScriptRuntime, source: String) throws -> JavaScriptFunction {
    return try driver(
      runtime,
      """
      var stmt = new NativeStatement();
      db.prepareSync(stmt, '\(source)');
      stmt.runSync(db, {}, {}, true);
      stmt.getColumnNamesSync();
      stmt.getAllSync(db);
      stmt.finalizeSync(db);
      """
    )
  }

  @Test
  func `JS: empty driver loop`() async throws {
    try await sqliteBenchmarkCase { appContext in
      let runtime = try prepareRuntime(appContext)
      let run = try driver(runtime, "")
      try benchmark("JS: empty driver loop", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `JS: exec a trivial statement`() async throws {
    try await sqliteBenchmarkCase { appContext in
      let runtime = try prepareRuntime(appContext)
      let run = try driver(runtime, "db.execSync('SELECT 1');")
      try benchmark("JS: execSync('SELECT 1')", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `JS: construct a statement`() async throws {
    try await sqliteBenchmarkCase { appContext in
      let runtime = try prepareRuntime(appContext)
      let run = try driver(runtime, "new NativeStatement();")
      try benchmark("JS: new NativeStatement()", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `JS: getAll one row`() async throws {
    try await sqliteBenchmarkCase { appContext in
      let runtime = try prepareRuntime(appContext)
      let run = try getAllDriver(runtime, source: "SELECT \(BenchmarkSchema.selectColumns) FROM t WHERE id = 1")
      try benchmark("JS: getAllSync 1 row (prepare, run, columns, getAll, finalize)", runtime: runtime) {
        iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `JS: getAll 100 rows`() async throws {
    try await sqliteBenchmarkCase { appContext in
      let runtime = try prepareRuntime(appContext)
      let run = try getAllDriver(runtime, source: "SELECT \(BenchmarkSchema.selectColumns) FROM t WHERE id <= 100")
      try benchmark("JS: getAllSync 100 rows", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `JS: getAll 10k rows`() async throws {
    try await sqliteBenchmarkCase { appContext in
      let runtime = try prepareRuntime(appContext)
      let run = try getAllDriver(runtime, source: "SELECT \(BenchmarkSchema.selectColumns) FROM t")
      try benchmark("JS: getAllSync 10k rows", runtime: runtime, samples: 5) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `JS: getAll 100 rows with a 1 KiB blob column`() async throws {
    try await sqliteBenchmarkCase { appContext in
      let runtime = try prepareRuntime(appContext)
      let run = try getAllDriver(runtime, source: "SELECT id, data FROM blobs")
      try benchmark("JS: getAllSync 100 rows with 1 KiB blob", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  /// `SQLiteStatement.executeSync(...).getAllSync()` on a statement prepared once.
  @Test
  func `JS: reuse a prepared statement`() async throws {
    try await sqliteBenchmarkCase { appContext in
      let runtime = try prepareRuntime(appContext)
      _ = try runtime.eval(
        """
        var prepared = new NativeStatement();
        db.prepareSync(prepared, 'SELECT \(BenchmarkSchema.selectColumns) FROM t WHERE id > ? LIMIT 100');
        """
      )
      let run = try driver(
        runtime,
        """
        prepared.runSync(db, { 0: i % 9000 }, {}, true);
        prepared.getColumnNamesSync();
        prepared.getAllSync(db);
        """
      )
      try benchmark("JS: prepared statement reuse, 100 rows", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  /// `SQLiteDatabase.runSync(source, [params])` without the prepare and finalize around it, so the
  /// number isolates parameter binding and the run result.
  @Test
  func `JS: insert with array parameters`() async throws {
    try await sqliteBenchmarkCase { appContext in
      let runtime = try prepareRuntime(appContext)
      _ = try runtime.eval(
        """
        var insert = new NativeStatement();
        db.prepareSync(insert, 'INSERT INTO t (int_value, real_value, text_value, null_value) VALUES (?, ?, ?, ?)');
        """
      )
      let run = try driver(runtime, "insert.runSync(db, { 0: i, 1: 1.5, 2: 'row', 3: null }, {}, true);")
      try benchmark("JS: runSync insert with 4 array parameters", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }

  @Test
  func `JS: column names of a prepared statement`() async throws {
    try await sqliteBenchmarkCase { appContext in
      let runtime = try prepareRuntime(appContext)
      _ = try runtime.eval(
        """
        var columns = new NativeStatement();
        db.prepareSync(columns, 'SELECT \(BenchmarkSchema.selectColumns) FROM t');
        """
      )
      let run = try driver(runtime, "columns.getColumnNamesSync();")
      try benchmark("JS: getColumnNamesSync (5 columns)", runtime: runtime) { iterations in
        _ = try run.call(arguments: iterations)
      }
    }
  }
}

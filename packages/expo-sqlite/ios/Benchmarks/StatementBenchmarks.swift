// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore
@testable import ExpoSQLite

/// SQLite copies a bound text before `bind` returns, as the module does for every text parameter.
private let sqliteTransient = unsafeBitCast(OpaquePointer(bitPattern: -1), to: sqlite3_destructor_type.self)

/// Native-only benchmarks: the raw SQLite C API on one side, the Swift members of `NativeDatabase`
/// and `NativeStatement` on the other. Reading them side by side isolates the cost the Swift layer
/// adds (string bridging, the statement semaphore, error checks) from the cost of SQLite itself.
extension Benchmarks {
  /// Opens a seeded in-memory database through the C API and wraps it the way the module does.
  /// Setup failures stop the case, so a broken handle is never timed.
  private func openDatabase() throws -> NativeDatabase {
    var pointer: OpaquePointer?
    try #require(exsqlite3_open(":memory:", &pointer) == SQLITE_OK)
    try #require(exsqlite3_exec(pointer, BenchmarkSchema.setup(), nil, nil, nil) == SQLITE_OK)
    return NativeDatabase(pointer, databasePath: ":memory:", openOptions: OpenDatabaseOptions())
  }

  private func prepare(_ source: String, in database: NativeDatabase) throws -> OpaquePointer? {
    var statement: OpaquePointer?
    try #require(exsqlite3_prepare_v2(database.pointer, source, -1, &statement, nil) == SQLITE_OK)
    return statement
  }

  /// Touches every column of the current row the way `getColumnValue` does, without allocating.
  private func readRow(_ statement: OpaquePointer?) {
    for column in 0..<Int32(BenchmarkSchema.columnCount) {
      switch exsqlite3_column_type(statement, column) {
      case SQLITE_INTEGER:
        _ = exsqlite3_column_int64(statement, column)
      case SQLITE_FLOAT:
        _ = exsqlite3_column_double(statement, column)
      case SQLITE_TEXT:
        _ = exsqlite3_column_text(statement, column)
        _ = exsqlite3_column_bytes(statement, column)
      default:
        break
      }
    }
  }

  // MARK: - SQLite floor

  @Test
  func `raw C: select one row by id`() async throws {
    try await sqliteBenchmarkCase { appContext in
      let database = try openDatabase()
      let runtime = try appContext.runtime
      let statement = try prepare("SELECT \(BenchmarkSchema.selectColumns) FROM t WHERE id = ?", in: database)
      benchmark("raw C: select 1 row by id", runtime: runtime) { iterations in
        for i in 0..<iterations {
          exsqlite3_bind_int64(statement, 1, Int64(i % BenchmarkSchema.rowCount) + 1)
          _ = exsqlite3_step(statement)
          readRow(statement)
          exsqlite3_reset(statement)
        }
      }
      exsqlite3_finalize(statement)
      exsqlite3_close(database.pointer)
    }
  }

  @Test
  func `raw C: select 100 rows`() async throws {
    try await sqliteBenchmarkCase { appContext in
      let database = try openDatabase()
      let runtime = try appContext.runtime
      let statement = try prepare("SELECT \(BenchmarkSchema.selectColumns) FROM t WHERE id <= 100", in: database)
      benchmark("raw C: select 100 rows, read every cell", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          while exsqlite3_step(statement) == SQLITE_ROW {
            readRow(statement)
          }
          exsqlite3_reset(statement)
        }
      }
      exsqlite3_finalize(statement)
      exsqlite3_close(database.pointer)
    }
  }

  @Test
  func `raw C: insert with bound parameters`() async throws {
    try await sqliteBenchmarkCase { appContext in
      let database = try openDatabase()
      let runtime = try appContext.runtime
      let statement = try prepare(
        "INSERT INTO t (int_value, real_value, text_value, null_value) VALUES (?, ?, ?, ?)",
        in: database
      )
      benchmark("raw C: insert with 4 bound parameters", runtime: runtime) { iterations in
        for i in 0..<iterations {
          exsqlite3_bind_int64(statement, 1, Int64(i))
          exsqlite3_bind_double(statement, 2, 1.5)
          exsqlite3_bind_text(statement, 3, "row", -1, sqliteTransient)
          exsqlite3_bind_null(statement, 4)
          _ = exsqlite3_step(statement)
          exsqlite3_reset(statement)
          exsqlite3_clear_bindings(statement)
        }
      }
      exsqlite3_finalize(statement)
      exsqlite3_close(database.pointer)
    }
  }

  @Test
  func `raw C: prepare and finalize`() async throws {
    try await sqliteBenchmarkCase { appContext in
      let database = try openDatabase()
      let runtime = try appContext.runtime
      let source = "SELECT \(BenchmarkSchema.selectColumns) FROM t WHERE id = 1"
      benchmark("raw C: prepare + finalize", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          var statement: OpaquePointer?
          exsqlite3_prepare_v2(database.pointer, source, -1, &statement, nil)
          exsqlite3_finalize(statement)
        }
      }
      exsqlite3_close(database.pointer)
    }
  }

  // MARK: - Swift members

  @Test
  func `Swift: prepare and finalize through the shared objects`() async throws {
    try await sqliteBenchmarkCase { appContext in
      let database = try openDatabase()
      let runtime = try appContext.runtime
      let source = "SELECT \(BenchmarkSchema.selectColumns) FROM t WHERE id = 1"
      try benchmark("Swift: prepareSync + finalizeSync", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          let statement = NativeStatement()
          try database.prepareSync(statement: statement, source: source)
          try statement.finalizeSync(database: database)
        }
      }
      exsqlite3_close(database.pointer)
    }
  }

  @Test
  func `Swift: column names of a prepared statement`() async throws {
    try await sqliteBenchmarkCase { appContext in
      let database = try openDatabase()
      let runtime = try appContext.runtime
      let statement = NativeStatement()
      try database.prepareSync(statement: statement, source: "SELECT \(BenchmarkSchema.selectColumns) FROM t")
      try benchmark("Swift: getColumnNamesSync (5 columns)", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          _ = try statement.getColumnNamesSync()
        }
      }
      try statement.finalizeSync(database: database)
      exsqlite3_close(database.pointer)
    }
  }

  @Test
  func `Swift: exec a trivial statement`() async throws {
    try await sqliteBenchmarkCase { appContext in
      let database = try openDatabase()
      let runtime = try appContext.runtime
      try benchmark("Swift: execSync('SELECT 1')", runtime: runtime) { iterations in
        for _ in 0..<iterations {
          try database.execSync(source: "SELECT 1")
        }
      }
      exsqlite3_close(database.pointer)
    }
  }
}

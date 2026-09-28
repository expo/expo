// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore
@testable import ExpoSQLite

/// Umbrella suite for the ExpoSQLite benchmarks; the other files in this directory extend it.
///
/// The benchmarks are the `Benchmarks` test spec of the pod, separate from the unit tests. Run them
/// with `et native-unit-tests -p ios --packages expo-sqlite --benchmarks`, which builds the pods in
/// the Release configuration and runs the bundle natively on the Mac through the Mac Catalyst
/// destination. Each case prints one `[benchmark]` line with the median and minimum ns/op.
///
/// The suite is serialized so only one benchmark runs at a time: the `JavaScriptActor` executor runs
/// jobs synchronously on the calling thread, so cases running in parallel would disturb each other's
/// measurements.
@Suite(.serialized)
struct Benchmarks {}

/// Runs one case with a fresh app context whose runtime has the `ExpoSQLite` module installed, so
/// JavaScript drivers reach it as `expo.modules.ExpoSQLite`.
func sqliteBenchmarkCase(_ body: @escaping @JavaScriptActor (AppContext) throws -> Void) async throws {
  try await benchmarkCase {
    let appContext = AppContext.create()
    appContext.moduleRegistry.register(module: SQLiteModule(appContext: appContext), name: nil)
    try body(appContext)
  }
}

/// The table every benchmark queries: five columns covering the SQLite storage classes the module
/// converts, seeded with `rowCount` rows.
enum BenchmarkSchema {
  static let rowCount = 10_000
  static let columnCount = 5

  static let selectColumns = "id, int_value, real_value, text_value, null_value"

  static func setup(rows: Int = rowCount) -> String {
    return """
      CREATE TABLE t (
        id INTEGER PRIMARY KEY NOT NULL,
        int_value INTEGER NOT NULL,
        real_value REAL NOT NULL,
        text_value TEXT NOT NULL,
        null_value TEXT
      );
      WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < \(rows))
      INSERT INTO t (int_value, real_value, text_value, null_value)
      SELECT n, n * 1.5, 'row-' || n || '-' || hex(randomblob(8)), NULL FROM seq;
      CREATE TABLE blobs (id INTEGER PRIMARY KEY NOT NULL, data BLOB NOT NULL);
      WITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 100)
      INSERT INTO blobs (data) SELECT randomblob(1024) FROM seq;
      """
  }
}

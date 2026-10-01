import ExpoAppMetrics
import Foundation
import Testing

@testable import ExpoObserve

// Pins the values that let installed apps keep their stored data across updates. A different
// folder, file name, or schema version would leave the old file behind or wipe it.
@AppMetricsActor
@Suite("Metrics database location")
struct MetricsStoreLocationTests {
  @Test
  func `opens the production database in the ExpoAppMetrics folder`() throws {
    let path = try #require(DatabaseMetricsSink.database?.fileUrl.path)
    #if os(tvOS)
    #expect(path.hasSuffix("/Library/Caches/ExpoAppMetrics/metrics.db"))
    #else
    #expect(path.hasSuffix("/Documents/ExpoAppMetrics/metrics.db"))
    #endif
  }

  @Test
  func `uses the metrics db file at schema version 3`() throws {
    try withTemporaryDirectory { directoryUrl in
      let database = try MetricsDatabase(directoryUrl: directoryUrl)
      #expect(database.fileUrl.lastPathComponent == "metrics.db")
      #expect(MetricsDatabase.currentSchemaVersion == 3)
      #expect(database.schemaVersion == 3)
    }
  }

  @Test
  func `keeps the stored rows when the file is opened again`() throws {
    try withTemporaryDirectory { directoryUrl in
      do {
        let database = try MetricsDatabase(directoryUrl: directoryUrl)
        try database.insert(
          session: SessionRow(id: "s", type: "main", startTimestamp: Date.now.ISO8601Format(), isActive: true)
        )
        try database.insert(
          metric: MetricRow(sessionId: "s", timestamp: Date.now.ISO8601Format(), name: "m", value: 1)
        )
      }

      let reopened = try MetricsDatabase(directoryUrl: directoryUrl)
      #expect(try reopened.getSession(id: "s") != nil)
      #expect(try reopened.getMetrics(sessionId: "s").map(\.name) == ["m"])
    }
  }
}

private func withTemporaryDirectory(_ body: (URL) throws -> Void) throws {
  let directoryUrl = FileManager.default.temporaryDirectory
    .appendingPathComponent("MetricsStoreLocationTests-\(UUID().uuidString)")
  try FileManager.default.createDirectory(at: directoryUrl, withIntermediateDirectories: true)
  defer {
    try? FileManager.default.removeItem(at: directoryUrl)
  }
  try body(directoryUrl)
}

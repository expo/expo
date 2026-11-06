import Foundation
import Testing

@testable import ExpoAppMetrics

private func makeRow(name: String = "checkout", sessionId: String = "s") -> SpanRow? {
  let recorder = SpanRecorder(
    name: name,
    sessionId: sessionId,
    startTimestampMs: 1_782_131_895_000
  )
  return recorder.end(statusCode: nil, statusMessage: nil, endTimestampMs: 1_782_131_895_250)
}

@AppMetricsActor
@Suite("SpanWriter")
struct SpanWriterTests {
  private func withTemporaryDatabase(_ body: (MetricsDatabase) async throws -> Void) async throws {
    let directoryUrl = FileManager.default.temporaryDirectory
      .appendingPathComponent("SpanWriterTests-\(UUID().uuidString)")
    try FileManager.default.createDirectory(at: directoryUrl, withIntermediateDirectories: true)
    defer {
      try? FileManager.default.removeItem(at: directoryUrl)
    }
    let database = try MetricsDatabase(directoryUrl: directoryUrl)
    // Opening the database queues a prune of sessions past the retention window, which runs as
    // soon as a test suspends. A session that starts now survives it.
    try database.insert(
      session: SessionRow(
        id: "s",
        type: "main",
        startTimestamp: Date.now.ISO8601Format(),
        isActive: true
      )
    )
    try await body(database)
  }

  private func spanNames(in database: MetricsDatabase) throws -> [String] {
    return try database.getSpans(afterId: -1).map(\.name)
  }

  @Test
  func `writes a row`() async throws {
    try await withTemporaryDatabase { database in
      let row = try #require(makeRow())
      SpanWriter(database: database).write(row)
      let names = try spanNames(in: database)
      #expect(names == ["checkout"])
    }
  }

  @Test
  func `a failed insert does not stop later writes`() async throws {
    try await withTemporaryDatabase { database in
      let writer = SpanWriter(database: database)
      // No session has this id, so the foreign key rejects the insert.
      let orphan = try #require(makeRow(name: "orphan", sessionId: "missing"))
      let kept = try #require(makeRow(name: "kept"))
      writer.write(orphan)
      writer.write(kept)
      let names = try spanNames(in: database)
      #expect(names == ["kept"])
    }
  }

  @Test
  func `schedule writes the row on the actor`() async throws {
    try await withTemporaryDatabase { database in
      let writer = SpanWriter(database: database)
      let row = try #require(makeRow())
      writer.schedule(row)
      // The write runs in a task on this actor, so it can only land while this test is suspended.
      var attempts = 0
      while try spanNames(in: database).isEmpty, attempts < 100 {
        attempts += 1
        try await Task.sleep(for: .milliseconds(10))
      }
      let names = try spanNames(in: database)
      #expect(names == ["checkout"])
    }
  }
}

import Foundation
import Testing

@testable import ExpoAppMetrics

@AppMetricsActor
@Suite("MetricsDatabase")
struct MetricsDatabaseTests {
  @Test
  func `has a valid file URL`() throws {
    try withTemporaryDatabase { database in
      #expect(database.fileUrl.isFileURL)
      #expect(database.fileUrl.pathExtension == "db")
    }
  }

  @Test
  func `creates schema with current version on first open`() throws {
    try withTemporaryDatabase { database in
      let version = database.schemaVersion
      #expect(version == MetricsDatabase.currentSchemaVersion)
    }
  }

  @Test
  func `reusing the same file does not duplicate the schema version row`() throws {
    try withTemporaryDirectory { directoryUrl in
      _ = try MetricsDatabase(directoryUrl: directoryUrl)
      let database = try MetricsDatabase(directoryUrl: directoryUrl)
      let count = try countRows(database: database, table: "schema_version")
      #expect(count == 1)
    }
  }

  @Test
  func `wipes the file when its schema version differs from this build`() throws {
    for offset in [-1, 1] {
      try withTemporaryDirectory { directoryUrl in
        // Simulate a database written by a different build: insert a session, then nudge
        // schema_version to a value this build doesn't recognise.
        do {
          let database = try MetricsDatabase(directoryUrl: directoryUrl)
          try database.insert(session: makeSessionRow(id: "from-another-build"))
          let bump = try database.database.prepare("UPDATE schema_version SET version = ?1")
          try bump.bindAll([MetricsDatabase.currentSchemaVersion + offset])
          try bump.run()
        }

        // Reopening should detect the mismatch, wipe the file, and start fresh.
        let database = try MetricsDatabase(directoryUrl: directoryUrl)
        let restoredSession = try database.getSession(id: "from-another-build")
        let restoredVersion = database.schemaVersion
        #expect(restoredSession == nil)
        #expect(restoredVersion == MetricsDatabase.currentSchemaVersion)
      }
    }
  }

  // MARK: - Sessions

  @Test
  func `inserts and reads back a session`() throws {
    try withTemporaryDatabase { database in
      let row = makeSessionRow(id: "session-1")
      try database.insert(session: row)

      let fetched = try #require(try database.getSession(id: "session-1"))
      #expect(fetched.id == row.id)
      #expect(fetched.type == row.type)
      #expect(fetched.startTimestamp == row.startTimestamp)
      #expect(fetched.endTimestamp == nil)
      #expect(fetched.isActive == true)
      #expect(fetched.environment == row.environment)
      #expect(fetched.appName == row.appName)
      #expect(fetched.deviceModel == row.deviceModel)
      #expect(fetched.expoSdkVersion == row.expoSdkVersion)
    }
  }

  @Test
  func `inserting a session with an existing id is a no-op`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "session-dup", appName: "first"))
      try database.insert(session: makeSessionRow(id: "session-dup", appName: "second"))

      let fetched = try #require(try database.getSession(id: "session-dup"))
      #expect(fetched.appName == "first")
    }
  }

  @Test
  func `child rows survive an INSERT OR IGNORE conflict on their session`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "session-keep", appName: "original"))
      try database.insert(metric: makeMetricRow(sessionId: "session-keep", name: "m"))
      try database.insert(log: makeLogRow(sessionId: "session-keep", name: "l"))

      // Re-inserting with the same id should be ignored, leaving the original row and its children
      // intact. This locks in the `INSERT OR IGNORE` semantics — switching to `INSERT OR REPLACE`
      // in the future would orphan the children via FK cascade.
      try database.insert(session: makeSessionRow(id: "session-keep", appName: "should-be-ignored"))

      let fetched = try #require(try database.getSession(id: "session-keep"))
      let metricNames = try database.getMetrics(sessionId: "session-keep").map(\.name)
      let logNames = try database.getLogs(sessionId: "session-keep").map(\.name)
      #expect(fetched.appName == "original")
      #expect(metricNames == ["m"])
      #expect(logNames == ["l"])
    }
  }

  @Test
  func `getSession returns nil for unknown id`() throws {
    try withTemporaryDatabase { database in
      let fetched = try database.getSession(id: "missing")
      #expect(fetched == nil)
    }
  }

  @Test
  func `updates active status and end timestamp`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "session-active"))
      try database.updateSessionActiveStatus(
        id: "session-active",
        isActive: false,
        endTimestamp: "2026-05-07T12:00:00Z"
      )

      let fetched = try #require(try database.getSession(id: "session-active"))
      #expect(fetched.isActive == false)
      #expect(fetched.endTimestamp == "2026-05-07T12:00:00Z")
    }
  }

  @Test
  func `deactivates active sessions started before the cutoff`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "old", startTimestamp: "2026-05-01T00:00:00Z"))
      try database.insert(session: makeSessionRow(id: "new", startTimestamp: "2026-05-07T00:00:00Z"))

      try database.deactivateAllSessionsBefore(timestamp: "2026-05-05T00:00:00Z")

      let oldRow = try #require(try database.getSession(id: "old"))
      let newRow = try #require(try database.getSession(id: "new"))
      #expect(oldRow.isActive == false)
      #expect(newRow.isActive == true)
    }
  }

  @Test
  func `updates environment for a single session`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s1", environment: "development"))
      try database.updateEnvironment(id: "s1", environment: "production")

      let fetched = try #require(try database.getSession(id: "s1"))
      #expect(fetched.environment == "production")
    }
  }

  @Test
  func `updates environment only for active sessions`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "active", environment: "development"))
      try database.insert(session: makeSessionRow(id: "inactive", environment: "development"))
      try database.updateSessionActiveStatus(id: "inactive", isActive: false, endTimestamp: nil)

      try database.updateEnvironmentForActiveSessions(environment: "staging")

      let activeRow = try #require(try database.getSession(id: "active"))
      let inactiveRow = try #require(try database.getSession(id: "inactive"))
      #expect(activeRow.environment == "staging")
      #expect(inactiveRow.environment == "development")
    }
  }

  @Test
  func `getInactiveSessions returns inactive rows ordered by start timestamp descending`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "older", startTimestamp: "2026-05-01T00:00:00Z"))
      try database.insert(session: makeSessionRow(id: "newer", startTimestamp: "2026-05-07T00:00:00Z"))
      try database.updateSessionActiveStatus(id: "older", isActive: false, endTimestamp: nil)
      try database.updateSessionActiveStatus(id: "newer", isActive: false, endTimestamp: nil)

      let rows = try database.getInactiveSessions()
      #expect(rows.map(\.id) == ["newer", "older"])
    }
  }

  @Test
  func `getInactiveSessions excludes active sessions`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "active"))
      try database.insert(session: makeSessionRow(id: "ended"))
      try database.updateSessionActiveStatus(id: "ended", isActive: false, endTimestamp: nil)

      let rows = try database.getInactiveSessions()
      #expect(rows.map(\.id) == ["ended"])
    }
  }

  @Test
  func `getAllActiveSessions filters out inactive sessions`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "active"))
      try database.insert(session: makeSessionRow(id: "inactive"))
      try database.updateSessionActiveStatus(id: "inactive", isActive: false, endTimestamp: nil)

      let rows = try database.getAllActiveSessions()
      #expect(rows.map(\.id) == ["active"])
    }
  }

  @Test
  func `deleteSession removes the row`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "victim"))
      try database.deleteSession(id: "victim")
      let fetched = try database.getSession(id: "victim")
      #expect(fetched == nil)
    }
  }

  @Test
  func `deleteAllSessions clears every row`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "a"))
      try database.insert(session: makeSessionRow(id: "b"))
      try database.deleteAllSessions()
      #expect(try database.getSession(id: "a") == nil)
      #expect(try database.getSession(id: "b") == nil)
    }
  }

  @Test
  func `init deactivates sessions that were still active from a previous launch`() async throws {
    try await withTemporaryDirectory { directoryUrl in
      // Seed the file with a session left in `isActive = 1` (the previous process never reached
      // `stop()`). Then reopen and confirm `init` flipped it inactive.
      do {
        let database = try MetricsDatabase(directoryUrl: directoryUrl)
        try database.insert(session: makeSessionRow(id: "orphaned-active"))
      }

      let database = try MetricsDatabase(directoryUrl: directoryUrl)
      let active = try await AppMetricsActor.isolated {
        return try database.getAllActiveSessions().map(\.id)
      }
      #expect(active.isEmpty)
    }
  }

  @Test
  func `init prunes sessions past the retention window`() async throws {
    try await withTemporaryDirectory { directoryUrl in
      // Seed the file with one row past the retention cutoff and one well inside it, then drop the
      // database and reopen. After awaiting an actor-isolated call (which FIFO-queues behind the
      // init-scheduled prune), only the fresh row should remain.
      do {
        let database = try MetricsDatabase(directoryUrl: directoryUrl)
        let expired = Date.now.addingTimeInterval(-MetricsDatabase.sessionRetention - 60).ISO8601Format()
        let fresh = Date.now.addingTimeInterval(-60).ISO8601Format()
        try database.insert(session: makeSessionRow(id: "expired", startTimestamp: expired))
        try database.insert(session: makeSessionRow(id: "fresh", startTimestamp: fresh))
      }

      let database = try MetricsDatabase(directoryUrl: directoryUrl)
      let (expired, fresh) = try await AppMetricsActor.isolated {
        return (try database.getSession(id: "expired"), try database.getSession(id: "fresh"))
      }
      #expect(expired == nil)
      #expect(fresh != nil)
    }
  }

  @Test
  func `cleanupSessions removes rows older than the cutoff regardless of active flag`() throws {
    try withTemporaryDatabase { database in
      // `old-active` simulates a session whose process crashed before it could be marked inactive —
      // it must still be cleaned up once it is past the cutoff.
      try database.insert(session: makeSessionRow(id: "old-inactive", startTimestamp: "2026-05-01T00:00:00Z"))
      try database.insert(session: makeSessionRow(id: "old-active", startTimestamp: "2026-05-01T00:00:00Z"))
      try database.insert(session: makeSessionRow(id: "new-active", startTimestamp: "2026-05-07T00:00:00Z"))
      try database.insert(session: makeSessionRow(id: "new-inactive", startTimestamp: "2026-05-07T00:00:00Z"))
      try database.updateSessionActiveStatus(id: "old-inactive", isActive: false, endTimestamp: nil)
      try database.updateSessionActiveStatus(id: "new-inactive", isActive: false, endTimestamp: nil)

      try database.cleanupSessions(olderThan: "2026-05-05T00:00:00Z")

      #expect(try database.getSession(id: "old-inactive") == nil)
      #expect(try database.getSession(id: "old-active") == nil)
      #expect(try database.getSession(id: "new-active") != nil)
      #expect(try database.getSession(id: "new-inactive") != nil)
    }
  }

  // MARK: - Metrics

  @Test
  func `insert metric returns auto-incremented id`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))

      let firstId = try database.insert(metric: makeMetricRow(sessionId: "s", name: "first"))
      let secondId = try database.insert(metric: makeMetricRow(sessionId: "s", name: "second"))
      #expect(secondId > firstId)
    }
  }

  @Test
  func `insertAll metrics writes every row`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))
      try database.insertAll(metrics: [
        makeMetricRow(sessionId: "s", name: "a"),
        makeMetricRow(sessionId: "s", name: "b"),
        makeMetricRow(sessionId: "s", name: "c"),
      ])

      let rows = try database.getMetrics(sessionId: "s")
      #expect(rows.map(\.name) == ["a", "b", "c"])
    }
  }

  @Test
  func `insertAll metrics with empty array is a no-op`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))
      try database.insertAll(metrics: [])
      let metrics = try database.getMetrics(sessionId: "s")
      #expect(metrics.isEmpty)
    }
  }

  @Test
  func `getMetrics returns rows in insertion order with full payload`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))
      try database.insert(
        metric: makeMetricRow(
          sessionId: "s",
          timestamp: "2026-05-07T12:00:00Z",
          category: "frameRate",
          name: "slowFrames",
          value: 1.5,
          routeName: "/home",
          updateId: "update-1",
          params: "{\"k\":1}"
        )
      )

      let row = try #require(try database.getMetrics(sessionId: "s").first)
      #expect(row.id != nil)
      #expect(row.sessionId == "s")
      #expect(row.timestamp == "2026-05-07T12:00:00Z")
      #expect(row.category == "frameRate")
      #expect(row.name == "slowFrames")
      #expect(row.value == 1.5)
      #expect(row.routeName == "/home")
      #expect(row.updateId == "update-1")
      #expect(row.params == "{\"k\":1}")
    }
  }

  @Test
  func `insertAll metrics rolls back when one row violates the foreign key`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "real"))

      #expect(throws: (any Error).self) {
        try database.insertAll(metrics: [
          makeMetricRow(sessionId: "real", name: "first"),
          makeMetricRow(sessionId: "missing-session", name: "orphan"),
          makeMetricRow(sessionId: "real", name: "third"),
        ])
      }

      // None of the rows in the batch should be visible — proving the transaction wrapper rolls back.
      let surviving = try database.getMetrics(sessionId: "real")
      #expect(surviving.isEmpty)
    }
  }

  @Test
  func `metrics are deleted when their session is deleted`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))
      try database.insert(metric: makeMetricRow(sessionId: "s", name: "doomed"))

      try database.deleteSession(id: "s")
      let metrics = try database.getMetrics(sessionId: "s")
      #expect(metrics.isEmpty)
    }
  }

  // MARK: - Logs

  @Test
  func `insert log returns auto-incremented id`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))

      let firstId = try database.insert(log: makeLogRow(sessionId: "s", name: "first"))
      let secondId = try database.insert(log: makeLogRow(sessionId: "s", name: "second"))
      #expect(secondId > firstId)
    }
  }

  @Test
  func `insertAll logs writes every row`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))
      try database.insertAll(logs: [
        makeLogRow(sessionId: "s", name: "a"),
        makeLogRow(sessionId: "s", name: "b"),
      ])

      let rows = try database.getLogs(sessionId: "s")
      #expect(rows.map(\.name) == ["a", "b"])
    }
  }

  @Test
  func `getLogs returns rows with full payload`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))
      try database.insert(
        log: makeLogRow(
          sessionId: "s",
          timestamp: "2026-05-07T12:00:00Z",
          severity: "error",
          name: "boom",
          body: "something exploded",
          attributes: "{\"key\":\"value\"}",
          droppedAttributesCount: 3
        )
      )

      let row = try #require(try database.getLogs(sessionId: "s").first)
      #expect(row.id != nil)
      #expect(row.sessionId == "s")
      #expect(row.timestamp == "2026-05-07T12:00:00Z")
      #expect(row.severity == "error")
      #expect(row.name == "boom")
      #expect(row.body == "something exploded")
      #expect(row.attributes == "{\"key\":\"value\"}")
      #expect(row.droppedAttributesCount == 3)
    }
  }

  @Test
  func `insertAll logs rolls back when one row violates the foreign key`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "real"))

      #expect(throws: (any Error).self) {
        try database.insertAll(logs: [
          makeLogRow(sessionId: "real", name: "first"),
          makeLogRow(sessionId: "missing-session", name: "orphan"),
          makeLogRow(sessionId: "real", name: "third"),
        ])
      }

      let surviving = try database.getLogs(sessionId: "real")
      #expect(surviving.isEmpty)
    }
  }

  @Test
  func `logs are deleted when their session is deleted`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))
      try database.insert(log: makeLogRow(sessionId: "s", name: "doomed"))

      try database.deleteSession(id: "s")
      let logs = try database.getLogs(sessionId: "s")
      #expect(logs.isEmpty)
    }
  }

  // MARK: - Crash reports

  @Test
  func `setCrashReport stores a payload retrievable by session id`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))
      try database.setCrashReport(sessionId: "s", payload: "{\"signal\":11}")

      let payload = try database.getCrashReport(sessionId: "s")
      #expect(payload == "{\"signal\":11}")
    }
  }

  @Test
  func `setCrashReport accepts an orphan session id`() throws {
    // Crashes can be attributed to a session id that was never persisted (the app crashed before
    // the session row reached disk). The crash report should still be storable and retrievable.
    try withTemporaryDatabase { database in
      try database.setCrashReport(sessionId: "orphan", payload: "{\"signal\":11}")

      let session = try database.getSession(id: "orphan")
      let payload = try database.getCrashReport(sessionId: "orphan")
      #expect(session == nil)
      #expect(payload == "{\"signal\":11}")
    }
  }

  @Test
  func `setCrashReport replaces an existing payload`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))
      try database.setCrashReport(sessionId: "s", payload: "{\"v\":1}")
      try database.setCrashReport(sessionId: "s", payload: "{\"v\":2}")

      let payload = try database.getCrashReport(sessionId: "s")
      #expect(payload == "{\"v\":2}")
    }
  }

  @Test
  func `getCrashReport returns nil when there is no entry`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))
      let payload = try database.getCrashReport(sessionId: "s")
      #expect(payload == nil)
    }
  }

  @Test
  func `crash report is deleted when its session is deleted`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))
      try database.setCrashReport(sessionId: "s", payload: "{}")

      try database.deleteSession(id: "s")
      let payload = try database.getCrashReport(sessionId: "s")
      #expect(payload == nil)
    }
  }

  @Test
  func `cleanupSessions removes the matching crash report`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "old", startTimestamp: "2026-05-01T00:00:00Z"))
      try database.setCrashReport(sessionId: "old", payload: "{}")

      try database.cleanupSessions(olderThan: "2026-05-05T00:00:00Z")

      let payload = try database.getCrashReport(sessionId: "old")
      #expect(payload == nil)
    }
  }

  @Test
  func `deleteAllSessions clears orphan crash reports too`() throws {
    try withTemporaryDatabase { database in
      try database.setCrashReport(sessionId: "orphan", payload: "{}")
      try database.deleteAllSessions()
      let payload = try database.getCrashReport(sessionId: "orphan")
      #expect(payload == nil)
    }
  }

  // MARK: - Spans

  @Test
  func `insert span returns auto-incremented id`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))
      let firstId = try database.insert(span: makeSpanRow(sessionId: "s"))
      let secondId = try database.insert(span: makeSpanRow(sessionId: "s"))
      #expect(secondId > firstId)
    }
  }

  @Test
  func `getSpans returns rows past the cursor in ascending id order`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))
      let firstId = try database.insert(span: makeSpanRow(sessionId: "s", name: "a"))
      try database.insert(span: makeSpanRow(sessionId: "s", name: "b"))
      try database.insert(span: makeSpanRow(sessionId: "s", name: "c"))
      let rows = try database.getSpans(afterId: firstId)
      #expect(rows.map(\.name) == ["b", "c"])
      #expect(rows.compactMap(\.id) == rows.compactMap(\.id).sorted())
    }
  }

  @Test
  func `span round-trips its full payload`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))
      try database.insert(
        span: makeSpanRow(
          sessionId: "s",
          traceId: "a3ce929d0e0e4736a3ce929d0e0e4736",
          spanId: "00f067aa0ba902b7",
          parentSpanId: "abcdef0123456789",
          name: "POST",
          kind: SpanRow.clientKind,
          startTimestampMs: 1_782_131_895_000,
          endTimestampMs: 1_782_131_895_250,
          statusCode: SpanRow.statusError,
          statusMessage: "went wrong",
          attributes: "{\"url.full\":\"https://example.com\"}",
          events: "[{\"name\":\"http.redirect\"}]"
        )
      )
      let row = try #require(try database.getSpans(afterId: -1).first)
      #expect(row.id != nil)
      #expect(row.sessionId == "s")
      #expect(row.traceId == "a3ce929d0e0e4736a3ce929d0e0e4736")
      #expect(row.spanId == "00f067aa0ba902b7")
      #expect(row.parentSpanId == "abcdef0123456789")
      #expect(row.name == "POST")
      #expect(row.kind == SpanRow.clientKind)
      #expect(row.startTimestampMs == 1_782_131_895_000)
      #expect(row.endTimestampMs == 1_782_131_895_250)
      #expect(row.statusCode == SpanRow.statusError)
      #expect(row.statusMessage == "went wrong")
      #expect(row.attributes == "{\"url.full\":\"https://example.com\"}")
      #expect(row.events == "[{\"name\":\"http.redirect\"}]")
    }
  }

  @Test
  func `span round-trips absent optionals as nil`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))
      try database.insert(span: makeSpanRow(sessionId: "s"))
      let row = try #require(try database.getSpans(afterId: -1).first)
      #expect(row.parentSpanId == nil)
      #expect(row.statusCode == nil)
      #expect(row.statusMessage == nil)
      #expect(row.attributes == nil)
      #expect(row.events == nil)
    }
  }

  @Test
  func `getMaxSpanId reflects the newest row and nil when empty`() throws {
    try withTemporaryDatabase { database in
      let emptyMaxId = try database.getMaxSpanId()
      #expect(emptyMaxId == nil)
      try database.insert(session: makeSessionRow(id: "s"))
      try database.insert(span: makeSpanRow(sessionId: "s"))
      let lastId = try database.insert(span: makeSpanRow(sessionId: "s"))
      let maxId = try database.getMaxSpanId()
      #expect(maxId == lastId)
    }
  }

  @Test
  func `deleteSpans removes rows up to and including the given id`() throws {
    // Dispatched rows are deleted rather than retained: unlike metrics and logs, no
    // per-session JS API reads them back, and spans are high-volume.
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))
      try database.insert(span: makeSpanRow(sessionId: "s"))
      let secondId = try database.insert(span: makeSpanRow(sessionId: "s"))
      let thirdId = try database.insert(span: makeSpanRow(sessionId: "s"))
      try database.deleteSpans(upToId: secondId)
      let remaining = try database.getSpans(afterId: -1)
      #expect(remaining.compactMap(\.id) == [thirdId])
    }
  }

  @Test
  func `spans are deleted when their session is deleted`() throws {
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))
      try database.insert(span: makeSpanRow(sessionId: "s"))
      try database.deleteSession(id: "s")
      let remaining = try database.getSpans(afterId: -1)
      #expect(remaining.isEmpty)
    }
  }

  @Test
  func `insert span prunes the oldest rows past the retention cap`() throws {
    // Span producers (network requests especially) can record orders of magnitude more rows
    // than metrics or logs. The cap bounds the table when nothing consumes (and deletes) the rows.
    try withTemporaryDatabase { database in
      try database.insert(session: makeSessionRow(id: "s"))
      for _ in 0..<(MetricsDatabase.spanCap + 10) {
        try database.insert(span: makeSpanRow(sessionId: "s"))
      }
      let count = try countRows(database: database, table: "spans")
      #expect(count <= MetricsDatabase.spanCap)
      let rows = try database.getSpans(afterId: -1)
      let maxId = try #require(try database.getMaxSpanId())
      #expect(rows.compactMap(\.id).max() == maxId)
    }
  }

  @Test
  func `adding the spans table preserves an existing database`() throws {
    // The table ships without a schema-version bump, so a database created by a build
    // that predates it must keep its rows when this build opens the file. This models
    // that by dropping the table and re-opening.
    try withTemporaryDirectory { directoryUrl in
      do {
        let database = try MetricsDatabase(directoryUrl: directoryUrl)
        try database.insert(session: makeSessionRow(id: "kept"))
        try database.database.execute("DROP TABLE spans;")
      }
      let database = try MetricsDatabase(directoryUrl: directoryUrl)
      let session = try database.getSession(id: "kept")
      #expect(session != nil)
      try database.insert(span: makeSpanRow(sessionId: "kept"))
      let requests = try database.getSpans(afterId: -1)
      #expect(requests.count == 1)
    }
  }

  // MARK: - Helpers
}

// MARK: - Test fixtures and temporary-directory helpers

/// Runs `body` against a fresh `MetricsDatabase` backed by a unique temporary directory that is
/// removed once the closure returns. Keeps tests isolated and prevents the user's documents directory
/// from accumulating leftover `.db` files across test runs.
@AppMetricsActor
private func withTemporaryDatabase(_ body: (MetricsDatabase) throws -> Void) throws {
  try withTemporaryDirectory { directoryUrl in
    let database = try MetricsDatabase(directoryUrl: directoryUrl)
    try body(database)
  }
}

private func withTemporaryDirectory(_ body: (URL) throws -> Void) throws {
  let directoryUrl = try makeTemporaryDirectory()
  defer {
    try? FileManager.default.removeItem(at: directoryUrl)
  }
  try body(directoryUrl)
}

private func withTemporaryDirectory(_ body: @AppMetricsActor @Sendable (URL) async throws -> Void) async throws {
  let directoryUrl = try makeTemporaryDirectory()
  defer {
    try? FileManager.default.removeItem(at: directoryUrl)
  }
  try await body(directoryUrl)
}

private func makeTemporaryDirectory() throws -> URL {
  let directoryUrl = FileManager.default.temporaryDirectory
    .appendingPathComponent("ExpoAppMetricsTests-\(UUID().uuidString)")
  try FileManager.default.createDirectory(at: directoryUrl, withIntermediateDirectories: true)
  return directoryUrl
}

private func makeSessionRow(
  id: String,
  type: String = "main",
  startTimestamp: String = "2026-05-07T12:00:00Z",
  environment: String? = "test",
  appName: String? = "TestApp"
) -> SessionRow {
  return SessionRow(
    id: id,
    type: type,
    startTimestamp: startTimestamp,
    isActive: true,
    environment: environment,
    appName: appName,
    appIdentifier: "dev.expo.test",
    appVersion: "1.0.0",
    appBuildNumber: "1",
    deviceOs: "iOS",
    deviceOsVersion: "26.0",
    deviceModel: "iPhone",
    deviceName: "Test iPhone",
    expoSdkVersion: "55.0.0",
    reactNativeVersion: "0.85.0",
    clientVersion: "0.1.0",
    languageTag: "en-US"
  )
}

private func makeMetricRow(
  sessionId: String,
  timestamp: String = "2026-05-07T12:00:00Z",
  category: String? = "appStartup",
  name: String,
  value: Double = 1.0,
  routeName: String? = nil,
  updateId: String? = nil,
  params: String? = nil
) -> MetricRow {
  return MetricRow(
    sessionId: sessionId,
    timestamp: timestamp,
    category: category,
    name: name,
    value: value,
    routeName: routeName,
    updateId: updateId,
    params: params
  )
}

private func makeLogRow(
  sessionId: String,
  timestamp: String = "2026-05-07T12:00:00Z",
  severity: String = "info",
  name: String,
  body: String? = nil,
  attributes: String? = nil,
  droppedAttributesCount: Int = 0
) -> LogRow {
  return LogRow(
    sessionId: sessionId,
    timestamp: timestamp,
    severity: severity,
    name: name,
    body: body,
    attributes: attributes,
    droppedAttributesCount: droppedAttributesCount
  )
}

private func makeSpanRow(
  sessionId: String,
  traceId: String = SpanRow.generateTraceId(),
  spanId: String = SpanRow.generateSpanId(),
  parentSpanId: String? = nil,
  name: String = "GET",
  kind: Int = SpanRow.clientKind,
  startTimestampMs: Int64 = 1_782_131_895_000,
  endTimestampMs: Int64 = 1_782_131_895_250,
  statusCode: Int? = nil,
  statusMessage: String? = nil,
  attributes: String? = nil,
  events: String? = nil
) -> SpanRow {
  return SpanRow(
    sessionId: sessionId,
    traceId: traceId,
    spanId: spanId,
    parentSpanId: parentSpanId,
    name: name,
    kind: kind,
    startTimestampMs: startTimestampMs,
    endTimestampMs: endTimestampMs,
    statusCode: statusCode,
    statusMessage: statusMessage,
    attributes: attributes,
    events: events
  )
}

@AppMetricsActor
private func countRows(database: MetricsDatabase, table: String) throws -> Int {
  let statement = try database.database.prepare("SELECT COUNT(*) FROM \(table)")
  var count = 0
  try statement.forEachRow { row in
    count = row.int(at: 0) ?? 0
  }
  return count
}

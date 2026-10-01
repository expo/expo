import Foundation
import Testing

@testable import ExpoAppMetrics
@testable import ExpoObserve

// Pinned to `AppMetricsActor` and serialized because two tests here set the process-wide
// `GlobalAttributes` store — see `GlobalAttributesTests` for why that store needs both.
@AppMetricsActor
@Suite("DatabaseMetricsSink", .serialized)
struct DatabaseMetricsSinkTests {
  init() {
    GlobalAttributes.set(nil)
  }

  @Test
  func `sessionStarted inserts an active session row with the environment`() throws {
    try withTemporarySink { sink, database in
      let info = SessionInfo(
        id: "s",
        type: .main,
        startDate: Date(timeIntervalSince1970: 1_700_000_000),
        app: AppInfo(
          appId: "dev.expo.app",
          appName: "App",
          appVersion: "1.2.3",
          buildNumber: "42",
          updatesInfo: AppInfo.UpdatesInfo(
            updateId: "update",
            runtimeVersion: "1.0",
            requestHeaders: ["expo-channel-name": "main"]
          )
        ),
        device: DeviceInfo(
          modelName: "iPhone",
          modelIdentifier: "iPhone18,2",
          systemName: "iOS",
          systemVersion: "26.0"
        ),
        languageTag: "pl-PL"
      )

      try sink.sessionStarted(info)

      let row = try #require(try database.getSession(id: "s"))
      #expect(row.type == "main")
      #expect(row.startTimestamp == info.startDate.ISO8601Format())
      #expect(row.endTimestamp == nil)
      #expect(row.isActive)
      #expect(row.environment == ObserveUserDefaults.environment ?? ObserveUserDefaults.defaultEnvironment)
      #expect(row.appIdentifier == "dev.expo.app")
      #expect(row.appName == "App")
      #expect(row.appVersion == "1.2.3")
      #expect(row.appBuildNumber == "42")
      #expect(row.appUpdateId == "update")
      #expect(row.appUpdateRuntimeVersion == "1.0")
      #expect(row.appUpdateRequestHeaders == #"{"expo-channel-name":"main"}"#)
      #expect(row.appEasBuildId == info.app.easBuildId)
      #expect(row.deviceName == "iPhone")
      #expect(row.deviceModel == "iPhone18,2")
      #expect(row.deviceOs == "iOS")
      #expect(row.deviceOsVersion == "26.0")
      #expect(row.expoSdkVersion == info.app.expoSdkVersion)
      #expect(row.reactNativeVersion == info.app.reactNativeVersion)
      #expect(row.clientVersion == info.app.clientVersion)
      #expect(row.languageTag == "pl-PL")
    }
  }

  @Test
  func `sessionEnded marks the session inactive with its end timestamp`() throws {
    try withTemporarySink { sink, database in
      try insertSession(id: "s", into: database)
      let endDate = Date(timeIntervalSince1970: 1_700_000_100)

      try sink.sessionEnded(id: "s", endDate: endDate)

      let row = try #require(try database.getSession(id: "s"))
      #expect(!row.isActive)
      #expect(row.endTimestamp == endDate.ISO8601Format())
    }
  }

  @Test
  func `records metrics and logs for the session`() throws {
    try withTemporarySink { sink, database in
      try insertSession(id: "s", into: database)

      try sink.record(
        metrics: [
          Metric(category: .session, name: "duration", value: 1, params: ["a": 1]),
          Metric(category: .memory, name: "m", value: 2),
        ],
        sessionId: "s"
      )
      try sink.record(logs: [LogRecord(name: "event", attributes: ["b": "c"], severity: .warn)], sessionId: "s")

      let metrics = try database.getMetrics(sessionId: "s")
      try #require(metrics.map(\.name) == ["duration", "m"])
      #expect(metrics[0].category == "session")
      #expect(metrics[0].params == #"{"a":1}"#)
      #expect(metrics[1].params == nil)
      let logs = try database.getLogs(sessionId: "s")
      #expect(logs.count == 1)
      #expect(logs.first?.name == "event")
      #expect(logs.first?.severity == "warn")
      #expect(logs.first?.attributes == #"{"b":"c"}"#)
    }
  }

  @Test
  func `records spans with generated ids`() throws {
    try withTemporarySink { sink, database in
      try insertSession(id: "s", into: database)
      let span = makeNetworkSpan()

      try sink.record(spans: [span, span], sessionId: "s")

      let rows = try database.getSpans(forSessionId: "s")
      try #require(rows.count == 2)
      let row = rows[0]
      #expect(row.name == span.name)
      #expect(row.kind == span.kind)
      #expect(row.startTimestampMs == span.startTimestampMs)
      #expect(row.endTimestampMs == span.endTimestampMs)
      #expect(row.statusCode == span.statusCode)
      #expect(row.statusMessage == span.statusMessage)
      #expect(row.attributes == span.attributes)
      #expect(row.events == span.events)
      #expect(row.parentSpanId == nil)
      #expect(row.traceId.count == 32)
      #expect(row.spanId.count == 16)
      #expect(rows[0].traceId != rows[1].traceId)
    }
  }

  @Test
  func `keeps at most the span cap`() throws {
    try withTemporarySink { sink, database in
      try insertSession(id: "s", into: database)

      try sink.record(
        spans: Array(repeating: makeNetworkSpan(), count: MetricsDatabase.spanCap + 1),
        sessionId: "s"
      )

      #expect(try database.getSpans(forSessionId: "s").count == MetricsDatabase.spanCap)
    }
  }

  @Test
  func `drops a span whose session row does not exist yet`() throws {
    try withTemporarySink { sink, database throws in
      #expect(throws: (any Error).self) {
        try sink.record(spans: [makeNetworkSpan()], sessionId: "never-inserted")
      }
      #expect(try database.getSpans(afterId: -1).isEmpty)
    }
  }

  @Test
  func `records a crash once for the matching main session`() throws {
    try withTemporarySink { sink, database in
      let now = Date.now
      try database.insert(
        session: SessionRow(
          id: "crashed",
          type: "main",
          startTimestamp: now.addingTimeInterval(-600).ISO8601Format(),
          isActive: false
        )
      )
      let report = makeCrashReport(timestampBegin: now.addingTimeInterval(-3600), timestampEnd: now)

      sink.record(crash: report, log: LogRecord(name: "native.exception"))
      sink.record(crash: report, log: LogRecord(name: "native.exception"))

      #expect(try database.getCrashReport(sessionId: "crashed") != nil)
      #expect(try database.getLogs(sessionId: "crashed").map(\.name) == ["native.exception"])
    }
  }

  @Test
  func `skips a crash with no matching main session`() throws {
    try withTemporarySink { sink, database in
      let now = Date.now
      try database.insert(
        session: SessionRow(
          id: "later",
          type: "main",
          startTimestamp: now.ISO8601Format(),
          isActive: true
        )
      )
      let report = makeCrashReport(
        timestampBegin: now.addingTimeInterval(-7200),
        timestampEnd: now.addingTimeInterval(-3600)
      )

      sink.record(crash: report, log: LogRecord(name: "native.exception"))

      #expect(try database.getCrashReport(sessionId: "later") == nil)
      #expect(try database.getLogs(sessionId: "later").isEmpty)
    }
  }

  @Test
  func `patches the updates info of active sessions only`() throws {
    try withTemporarySink { sink, database in
      try insertSession(id: "active", into: database)
      try insertSession(id: "inactive", isActive: false, into: database)

      try sink.activeSessionsUpdatesInfoChanged(
        AppInfo.UpdatesInfo(updateId: "update", runtimeVersion: "1.0", requestHeaders: ["h": "v"])
      )

      let active = try #require(try database.getSession(id: "active"))
      #expect(active.appUpdateId == "update")
      #expect(active.appUpdateRuntimeVersion == "1.0")
      #expect(active.appUpdateRequestHeaders == #"{"h":"v"}"#)
      let inactive = try #require(try database.getSession(id: "inactive"))
      #expect(inactive.appUpdateId == nil)
      #expect(inactive.appUpdateRuntimeVersion == nil)
      #expect(inactive.appUpdateRequestHeaders == nil)
    }
  }

  @Test
  func `updates the environment of active sessions only`() throws {
    try withTemporarySink { sink, database in
      try insertSession(id: "active", into: database)
      try insertSession(id: "inactive", isActive: false, into: database)

      try sink.updateEnvironmentForActiveSessions("staging")

      #expect(try database.getSession(id: "active")?.environment == "staging")
      #expect(try database.getSession(id: "inactive")?.environment == nil)
    }
  }

  @Test
  func `global attributes merged by the registry land in the stored metric and log rows`() throws {
    try withTemporarySink { sink, database in
      try insertSession(id: "s", into: database)
      let registry = MetricsSinkRegistry()
      registry.register(sink)
      GlobalAttributes.set(["tier": "pro", "screen": "global"])

      try registry.record(
        metrics: [Metric(category: .navigation, name: "m", value: 1, params: ["screen": "home"])],
        sessionId: "s"
      )
      try registry.record(logs: [LogRecord(name: "event", attributes: ["screen": "checkout"])], sessionId: "s")

      let metricParams = try parseJSON(try database.getMetrics(sessionId: "s").first?.params)
      #expect(metricParams.count == 2)
      #expect(metricParams["tier"] as? String == "pro")
      #expect(metricParams["screen"] as? String == "home")
      let logAttributes = try parseJSON(try database.getLogs(sessionId: "s").first?.attributes)
      #expect(logAttributes.count == 2)
      #expect(logAttributes["tier"] as? String == "pro")
      #expect(logAttributes["screen"] as? String == "checkout")
    }
  }

  @Test
  func `attributes each report in a multi-report crash batch to its own session`() throws {
    try withTemporarySink { sink, database in
      let earlierStart = Date(timeIntervalSince1970: 1_700_000_000)
      let laterStart = Date(timeIntervalSince1970: 1_700_100_000)
      try database.insert(
        session: SessionRow(
          id: "earlier",
          type: "main",
          startTimestamp: earlierStart.ISO8601Format(),
          endTimestamp: earlierStart.addingTimeInterval(500).ISO8601Format(),
          isActive: false
        )
      )
      try database.insert(
        session: SessionRow(
          id: "later",
          type: "main",
          startTimestamp: laterStart.ISO8601Format(),
          endTimestamp: laterStart.addingTimeInterval(500).ISO8601Format(),
          isActive: false
        )
      )
      let earlierReport = makeCrashReport(
        timestampBegin: earlierStart.addingTimeInterval(100),
        timestampEnd: earlierStart.addingTimeInterval(200)
      )
      let laterReport = makeCrashReport(
        timestampBegin: laterStart.addingTimeInterval(100),
        timestampEnd: laterStart.addingTimeInterval(200)
      )

      // A MetricKit payload batch delivers each report through one synchronous loop
      // (`MetricKitSubscriber.didReceive`), one `record(crash:log:)` call per report.
      sink.record(crash: earlierReport, log: LogRecord(name: "native.exception"))
      sink.record(crash: laterReport, log: LogRecord(name: "native.exception"))

      #expect(try database.getCrashReport(sessionId: "earlier") != nil)
      #expect(try database.getCrashReport(sessionId: "later") != nil)
      #expect(try database.getLogs(sessionId: "earlier").map(\.name) == ["native.exception"])
      #expect(try database.getLogs(sessionId: "later").map(\.name) == ["native.exception"])
    }
  }
}

@AppMetricsActor
private func withTemporarySink(_ body: (DatabaseMetricsSink, MetricsDatabase) throws -> Void) throws {
  let directoryUrl = FileManager.default.temporaryDirectory
    .appendingPathComponent("DatabaseMetricsSinkTests-\(UUID().uuidString)")
  try FileManager.default.createDirectory(at: directoryUrl, withIntermediateDirectories: true)
  defer {
    try? FileManager.default.removeItem(at: directoryUrl)
  }
  let database = try MetricsDatabase(directoryUrl: directoryUrl)
  try body(DatabaseMetricsSink { database }, database)
}

@AppMetricsActor
private func insertSession(id: String, isActive: Bool = true, into database: MetricsDatabase) throws {
  try database.insert(
    session: SessionRow(id: id, type: "main", startTimestamp: "2026-08-12T12:00:00Z", isActive: isActive)
  )
}

private func parseJSON(_ json: String?) throws -> [String: Any] {
  let raw = try #require(json)
  let data = try #require(raw.data(using: .utf8))
  return try #require(try JSONSerialization.jsonObject(with: data) as? [String: Any])
}

private func makeNetworkSpan() -> NetworkSpan {
  return NetworkSpan(
    name: "GET",
    kind: NetworkSpan.clientKind,
    startTimestampMs: 1_782_131_895_000,
    endTimestampMs: 1_782_131_895_250,
    statusCode: NetworkSpan.statusError,
    statusMessage: "failed",
    attributes: #"{"url.full":"https://example.com"}"#,
    events: #"[{"name":"expo.http.redirect"}]"#
  )
}

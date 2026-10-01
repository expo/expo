import Foundation
import Testing

@testable import ExpoAppMetrics

// Pinned to `AppMetricsActor` because the merge tests use the process-wide `GlobalAttributes`
// store. See `GlobalAttributesTests`. Each test sets the store in its own body, not in `init()`:
// another suite can change the store between `init()` and the test body.
@AppMetricsActor
@Suite("MetricsSinkRegistry", .serialized)
struct MetricsSinkRegistryTests {
  @Test
  func `delivers each operation to the registered sink in order`() throws {
    let registry = MetricsSinkRegistry()
    let sink = FakeMetricsSink()
    registry.register(sink)
    let endDate = Date(timeIntervalSince1970: 1_700_000_000)

    try registry.sessionStarted(makeSessionInfo(id: "s"))
    try registry.activeSessionsUpdatesInfoChanged(
      AppInfo.UpdatesInfo(updateId: "u", runtimeVersion: "1", requestHeaders: nil)
    )
    try registry.record(metrics: [Metric(category: .session, name: "m", value: 1)], sessionId: "s")
    try registry.record(logs: [LogRecord(name: "l")], sessionId: "s")
    try registry.record(spans: [makeNetworkSpan()], sessionId: "s")
    try registry.record(crash: makeCrashReport(timestampBegin: .now, timestampEnd: .now), log: LogRecord(name: "crash"))
    try registry.sessionEnded(id: "s", endDate: endDate)

    try #require(sink.calls.count == 7)
    guard case .sessionStarted(let session) = sink.calls[0] else {
      Issue.record("Expected sessionStarted, got \(sink.calls[0])")
      return
    }
    #expect(session.id == "s")
    guard case .updatesInfoChanged(let updatesInfo) = sink.calls[1] else {
      Issue.record("Expected updatesInfoChanged, got \(sink.calls[1])")
      return
    }
    #expect(updatesInfo.updateId == "u")
    guard case .metrics(let metrics, let metricsSessionId) = sink.calls[2] else {
      Issue.record("Expected metrics, got \(sink.calls[2])")
      return
    }
    #expect(metrics.map(\.name) == ["m"])
    #expect(metricsSessionId == "s")
    guard case .logs(let logs, let logsSessionId) = sink.calls[3] else {
      Issue.record("Expected logs, got \(sink.calls[3])")
      return
    }
    #expect(logs.map(\.name) == ["l"])
    #expect(logsSessionId == "s")
    guard case .spans(let spans, let spansSessionId) = sink.calls[4] else {
      Issue.record("Expected spans, got \(sink.calls[4])")
      return
    }
    #expect(spans.map(\.name) == ["GET"])
    #expect(spansSessionId == "s")
    guard case .crash(_, let crashLog) = sink.calls[5] else {
      Issue.record("Expected crash, got \(sink.calls[5])")
      return
    }
    #expect(crashLog.name == "crash")
    guard case .sessionEnded(let id, let ended) = sink.calls[6] else {
      Issue.record("Expected sessionEnded, got \(sink.calls[6])")
      return
    }
    #expect(id == "s")
    #expect(ended == endDate)
  }

  @Test
  func `rethrows the sink error`() {
    let registry = MetricsSinkRegistry()
    let sink = FakeMetricsSink()
    sink.error = FakeSinkError()
    registry.register(sink)

    #expect(throws: FakeSinkError.self) {
      try registry.record(logs: [LogRecord(name: "l")], sessionId: "s")
    }
  }

  @Test
  func `registering the same instance again keeps it`() throws {
    let registry = MetricsSinkRegistry()
    let sink = FakeMetricsSink()
    registry.register(sink)
    registry.register(sink)

    try registry.record(logs: [LogRecord(name: "l")], sessionId: "s")

    #expect(sink.calls.count == 1)
  }

  @Test
  func `a different instance replaces the registered sink`() throws {
    let registry = MetricsSinkRegistry()
    let first = FakeMetricsSink()
    let second = FakeMetricsSink()
    registry.register(first)
    registry.register(second)

    try registry.record(logs: [LogRecord(name: "l")], sessionId: "s")

    #expect(first.calls.isEmpty)
    #expect(second.calls.count == 1)
  }

  @Test
  func `drops records emitted while no sink is registered`() throws {
    let registry = MetricsSinkRegistry()
    try registry.sessionStarted(makeSessionInfo(id: "s"))
    try registry.record(logs: [LogRecord(name: "l")], sessionId: "s")

    let sink = FakeMetricsSink()
    registry.register(sink)

    #expect(sink.calls.isEmpty)
  }

  @Test
  func `merges global attributes into metrics and per-metric keys win`() throws {
    let registry = MetricsSinkRegistry()
    let sink = FakeMetricsSink()
    registry.register(sink)
    GlobalAttributes.set(["tier": "pro", "screen": "global"])

    try registry.record(
      metrics: [
        Metric(category: .navigation, name: "with-params", value: 1, params: ["screen": "home"]),
        Metric(category: .session, name: "without-params", value: 2),
      ],
      sessionId: "s"
    )

    guard case .metrics(let metrics, _) = try #require(sink.calls.first) else {
      Issue.record("Expected metrics, got \(sink.calls)")
      return
    }
    try #require(metrics.count == 2)
    let withParams = try #require(metrics[0].params?.value as? [String: Any])
    #expect(withParams.count == 2)
    #expect(withParams["tier"] as? String == "pro")
    #expect(withParams["screen"] as? String == "home")
    let withoutParams = try #require(metrics[1].params?.value as? [String: Any])
    #expect(withoutParams.count == 2)
    #expect(withoutParams["screen"] as? String == "global")
  }

  @Test
  func `merges global attributes into logs and per-event keys win`() throws {
    let registry = MetricsSinkRegistry()
    let sink = FakeMetricsSink()
    registry.register(sink)
    GlobalAttributes.set(["tier": "pro", "screen": "global"])
    let timestamp = "2026-01-01T00:00:00.000Z"

    try registry.record(
      logs: [
        LogRecord(
          name: "with-attributes",
          body: "body",
          attributes: ["screen": "checkout"],
          droppedAttributesCount: 3,
          severity: .warn,
          timestamp: timestamp
        ),
        LogRecord(name: "without-attributes"),
      ],
      sessionId: "s"
    )

    guard case .logs(let logs, _) = try #require(sink.calls.first) else {
      Issue.record("Expected logs, got \(sink.calls)")
      return
    }
    try #require(logs.count == 2)
    let withAttributes = try #require(logs[0].attributes?.value as? [String: Any])
    #expect(withAttributes.count == 2)
    #expect(withAttributes["tier"] as? String == "pro")
    #expect(withAttributes["screen"] as? String == "checkout")
    #expect(logs[0].name == "with-attributes")
    #expect(logs[0].body == "body")
    #expect(logs[0].droppedAttributesCount == 3)
    #expect(logs[0].severity == .warn)
    #expect(logs[0].timestamp == timestamp)
    let withoutAttributes = try #require(logs[1].attributes?.value as? [String: Any])
    #expect(withoutAttributes.count == 2)
  }

  @Test
  func `merges global attributes into the crash log`() throws {
    let registry = MetricsSinkRegistry()
    let sink = FakeMetricsSink()
    registry.register(sink)
    GlobalAttributes.set(["tier": "pro"])

    try registry.record(
      crash: makeCrashReport(timestampBegin: .now, timestampEnd: .now),
      log: LogRecord(name: "crash", attributes: ["a": 1])
    )

    guard case .crash(_, let log) = try #require(sink.calls.first) else {
      Issue.record("Expected crash, got \(sink.calls)")
      return
    }
    let attributes = try #require(log.attributes?.value as? [String: Any])
    #expect(attributes["tier"] as? String == "pro")
    #expect(attributes["a"] as? Int == 1)
  }

  @Test
  func `passes records through unchanged when no global attributes are set`() throws {
    let registry = MetricsSinkRegistry()
    let sink = FakeMetricsSink()
    registry.register(sink)
    GlobalAttributes.set(nil)

    try registry.record(metrics: [Metric(category: .session, name: "m", value: 1)], sessionId: "s")
    try registry.record(logs: [LogRecord(name: "l")], sessionId: "s")

    try #require(sink.calls.count == 2)
    guard case .metrics(let metrics, _) = sink.calls[0], case .logs(let logs, _) = sink.calls[1] else {
      Issue.record("Expected metrics and logs, got \(sink.calls)")
      return
    }
    #expect(metrics.first?.params == nil)
    #expect(logs.first?.attributes == nil)
  }

  @Test
  func `does not add global attributes to spans`() throws {
    let registry = MetricsSinkRegistry()
    let sink = FakeMetricsSink()
    registry.register(sink)
    GlobalAttributes.set(["tier": "pro"])
    let span = makeNetworkSpan()

    try registry.record(spans: [span], sessionId: "s")

    guard case .spans(let spans, _) = try #require(sink.calls.first) else {
      Issue.record("Expected spans, got \(sink.calls)")
      return
    }
    #expect(spans.first?.attributes == span.attributes)
  }
}

private func makeSessionInfo(id: String) -> SessionInfo {
  return SessionInfo(
    id: id,
    type: .main,
    startDate: Date(timeIntervalSince1970: 1_700_000_000),
    app: AppInfo(appId: "app", appName: "App", appVersion: "1.0", buildNumber: "1", updatesInfo: nil),
    device: DeviceInfo(modelName: "iPhone", modelIdentifier: "iPhone18,2", systemName: "iOS", systemVersion: "26.0"),
    languageTag: "en-US"
  )
}

private func makeNetworkSpan() -> NetworkSpan {
  return NetworkSpan(
    name: "GET",
    kind: NetworkSpan.clientKind,
    startTimestampMs: 1_782_131_895_000,
    endTimestampMs: 1_782_131_895_250,
    statusCode: nil,
    statusMessage: nil,
    attributes: #"{"url.full":"https://example.com"}"#,
    events: nil
  )
}

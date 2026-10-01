import Foundation
import Testing

@testable import ExpoAppMetrics

// Registers a fake sink on the shared registry for the duration of each test and restores the
// database sink afterwards. Other code can emit to the shared registry at the same time, so the
// assertions read only the calls for the session under test.
@AppMetricsActor
@Suite("Session sink", .serialized)
final class SessionSinkTests {
  let sink = FakeMetricsSink()

  init() {
    MetricsSinkRegistry.shared.register(sink)
  }

  deinit {
    MetricsSinkRegistry.shared.register(DatabaseMetricsSink.shared)
  }

  @Test
  func `init emits sessionStarted with a snapshot of the session`() async throws {
    let session = Session(type: .custom)

    let calls = try await waitForCalls(session: session, count: 1)

    guard case .sessionStarted(let info) = calls[0] else {
      Issue.record("Expected sessionStarted, got \(calls[0])")
      return
    }
    #expect(info.id == session.id)
    #expect(info.type == .custom)
    #expect(info.startDate == session.startDate)
    #expect(info.app == AppInfo.current)
    #expect(info.device == DeviceInfo.current)
    #expect(info.languageTag == Locale.preferredLanguages.first)
  }

  @Test
  func `stop emits sessionEnded and then one duration metric`() async throws {
    let session = Session(type: .custom)
    session.stop()

    let calls = try await waitForCalls(session: session, count: 3)

    guard case .sessionEnded(let id, let endDate) = calls[1] else {
      Issue.record("Expected sessionEnded, got \(calls[1])")
      return
    }
    #expect(id == session.id)
    #expect(endDate == session.endDate)
    guard case .metrics(let metrics, _) = calls[2] else {
      Issue.record("Expected metrics, got \(calls[2])")
      return
    }
    #expect(metrics.count == 1)
    #expect(metrics.first?.category == .session)
    #expect(metrics.first?.name == "duration")
  }

  @Test
  func `stop called twice emits once`() async throws {
    let session = Session(type: .custom)
    session.stop()
    session.stop()

    _ = try await waitForCalls(session: session, count: 3)
    try await Task.sleep(for: .milliseconds(100))

    #expect(sink.calls(forSessionId: session.id).count == 3)
  }

  @Test
  func `addMetric emits the metric with the session id`() throws {
    let session = Session(type: .custom)
    var input = SessionMetricInput()
    input.name = "ttr"
    input.value = 1.5

    try session.addMetric(input)

    guard case .metrics(let metrics, let sessionId) = sink.calls.last else {
      Issue.record("Expected metrics, got \(String(describing: sink.calls.last))")
      return
    }
    #expect(sessionId == session.id)
    #expect(metrics.map(\.name) == ["ttr"])
  }

  @Test
  func `addMetric rethrows the sink error`() {
    let session = Session(type: .custom)
    var input = SessionMetricInput()
    input.name = "ttr"
    input.value = 1.5
    sink.error = FakeSinkError()
    defer {
      sink.error = nil
    }

    #expect(throws: FakeSinkError.self) {
      try session.addMetric(input)
    }
  }

  @Test
  func `receiveMetric emits the metric with the session id`() {
    let session = Session(type: .custom)

    session.receiveMetric(Metric(category: .memory, name: "m", value: 1))

    guard case .metrics(let metrics, let sessionId) = sink.calls.last else {
      Issue.record("Expected metrics, got \(String(describing: sink.calls.last))")
      return
    }
    #expect(sessionId == session.id)
    #expect(metrics.map(\.name) == ["m"])
  }

  @Test
  func `receiveLog emits the log with the session id`() {
    let session = Session(type: .custom)

    session.receiveLog(LogRecord(name: "event"))

    guard case .logs(let logs, let sessionId) = sink.calls.last else {
      Issue.record("Expected logs, got \(String(describing: sink.calls.last))")
      return
    }
    #expect(sessionId == session.id)
    #expect(logs.map(\.name) == ["event"])
  }

  /// Waits for the calls that `Session` emits from its actor tasks.
  private func waitForCalls(session: Session, count: Int) async throws -> [FakeMetricsSink.Call] {
    for _ in 0..<200 {
      let calls = sink.calls(forSessionId: session.id)
      if calls.count >= count {
        return calls
      }
      try await Task.sleep(for: .milliseconds(10))
    }
    let calls = sink.calls(forSessionId: session.id)
    try #require(calls.count >= count, "Timed out waiting for \(count) calls for session \(session.id)")
    return calls
  }
}

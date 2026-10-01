import Foundation

@testable import ExpoAppMetrics

/// Records every sink call in order.
@AppMetricsActor
final class FakeMetricsSink: MetricsSink {
  enum Call {
    case sessionStarted(SessionInfo)
    case sessionEnded(id: String, endDate: Date)
    case updatesInfoChanged(AppInfo.UpdatesInfo)
    case metrics([Metric], sessionId: String)
    case logs([LogRecord], sessionId: String)
    case spans([NetworkSpan], sessionId: String)
    case crash(CrashReport, log: LogRecord)

    /// The session the call belongs to, or `nil` for calls that are not about one session.
    var sessionId: String? {
      switch self {
      case .sessionStarted(let session):
        return session.id
      case .sessionEnded(let id, _):
        return id
      case .metrics(_, let sessionId), .logs(_, let sessionId), .spans(_, let sessionId):
        return sessionId
      case .updatesInfoChanged, .crash:
        return nil
      }
    }
  }

  private(set) var calls: [Call] = []

  /// When set, every call throws this error after it is recorded.
  var error: (any Error)?

  nonisolated init() {}

  /// The calls for `sessionId`. Other tests and the host app can emit to the shared registry at the
  /// same time, so assertions on it filter by session.
  func calls(forSessionId sessionId: String) -> [Call] {
    return calls.filter { $0.sessionId == sessionId }
  }

  func sessionStarted(_ session: SessionInfo) throws {
    try append(.sessionStarted(session))
  }

  func sessionEnded(id: String, endDate: Date) throws {
    try append(.sessionEnded(id: id, endDate: endDate))
  }

  func activeSessionsUpdatesInfoChanged(_ updatesInfo: AppInfo.UpdatesInfo) throws {
    try append(.updatesInfoChanged(updatesInfo))
  }

  func record(metrics: [Metric], sessionId: String) throws {
    try append(.metrics(metrics, sessionId: sessionId))
  }

  func record(logs: [LogRecord], sessionId: String) throws {
    try append(.logs(logs, sessionId: sessionId))
  }

  func record(spans: [NetworkSpan], sessionId: String) throws {
    try append(.spans(spans, sessionId: sessionId))
  }

  func record(crash: CrashReport, log: LogRecord) throws {
    try append(.crash(crash, log: log))
  }

  private func append(_ call: Call) throws {
    calls.append(call)
    if let error {
      throw error
    }
  }
}

struct FakeSinkError: Error {}

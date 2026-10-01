import Foundation
import Testing

@testable import ExpoAppMetrics
@testable import ExpoObserve

// Serialized because the first test registers the database sink on the shared registry.
@AppMetricsActor
@Suite("Sink registration", .serialized)
struct SinkRegistrationTests {
  @Test
  func `the app delegate subscriber registers the database sink`() async throws {
    await MainActor.run {
      let subscriber = ObserveAppDelegateSubscriber()
      subscriber.appDelegateWillBeginInitialization()
      subscriber.appDelegateWillBeginInitialization()
    }
    let id = UUID().uuidString

    try MetricsSinkRegistry.shared.sessionStarted(makeSessionInfo(id: id))

    // Records that other suites emitted before the registration replay first, on a later actor turn.
    let row = try await waitFor { try DatabaseMetricsSink.database?.getSession(id: id) }
    #expect(row?.id == id)
  }

  @Test
  func `records emitted before registration reach the database sink in order`() async throws {
    let directoryUrl = FileManager.default.temporaryDirectory
      .appendingPathComponent("SinkRegistrationTests-\(UUID().uuidString)")
    try FileManager.default.createDirectory(at: directoryUrl, withIntermediateDirectories: true)
    defer {
      try? FileManager.default.removeItem(at: directoryUrl)
    }
    let database = try MetricsDatabase(directoryUrl: directoryUrl)
    let registry = MetricsSinkRegistry()

    try registry.sessionStarted(makeSessionInfo(id: "s"))
    try registry.record(metrics: [Metric(category: nil, name: "m", value: 1)], sessionId: "s")
    registry.register(DatabaseMetricsSink { database })

    // The metric row has a foreign key to the session row, so it is stored only after the session.
    let metrics = try await waitFor {
      let metrics = try database.getMetrics(sessionId: "s")
      return metrics.isEmpty ? nil : metrics
    }
    #expect(try database.getSession(id: "s") != nil)
    #expect(metrics?.map(\.name) == ["m"])
  }
}

private func makeSessionInfo(id: String) -> SessionInfo {
  return SessionInfo(
    id: id,
    type: .main,
    startDate: Date.now,
    app: AppInfo(appId: "app", appName: "App", appVersion: "1.0", buildNumber: "1", updatesInfo: nil),
    device: DeviceInfo(modelName: "iPhone", modelIdentifier: "iPhone18,2", systemName: "iOS", systemVersion: "26.0"),
    languageTag: "en-US"
  )
}

/// Polls `read` on the actor until it returns a value, for at most 5 seconds.
@AppMetricsActor
private func waitFor<T>(_ read: () throws -> T?) async throws -> T? {
  let deadline = Date.now.addingTimeInterval(5)
  while Date.now < deadline {
    if let value = try read() {
      return value
    }
    try await Task.sleep(for: .milliseconds(10))
  }
  return nil
}

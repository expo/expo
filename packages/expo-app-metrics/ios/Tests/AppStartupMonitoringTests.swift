import Testing

@testable import ExpoAppMetrics

@AppMetricsActor
@Suite("AppStartupMonitoring")
struct AppStartupMonitoringTests {
  private final class CapturingReceiver: MetricsReceiver, @unchecked Sendable {
    var metrics: [Metric] = []

    @AppMetricsActor
    func receiveMetric(_ metric: Metric) {
      metrics.append(metric)
    }
  }

  // Target frame duration for a 60fps display
  private let target: TimeInterval = 0.016

  private func frame(at timestamp: TimeInterval) -> Frame {
    return Frame(timestamp: timestamp, targetTimestamp: timestamp + target, duration: target)
  }

  private func makeMonitoring(receiver: CapturingReceiver) -> AppStartupMonitoring {
    let monitoring = AppStartupMonitoring()
    monitoring.launchType = .cold
    monitoring.markers.finishedLaunching = 0
    monitoring.addReceiver(receiver)
    return monitoring
  }

  private func ttiMetric(from receiver: CapturingReceiver) async throws -> Metric {
    // Both `markInteractive` and `reportMetric` dispatch via `Task {}`,
    // so we need to wait for them to run before asserting.
    for _ in 0..<20 {
      if let metric = receiver.metrics.first(where: { $0.name == "timeToInteractive" }) {
        return metric
      }
      try await Task.sleep(for: .milliseconds(10))
    }
    Issue.record("Expected a timeToInteractive metric to be reported")
    throw CancellationError()
  }

  @Test
  func `forwards user-supplied params to the emitted metric`() async throws {
    let receiver = CapturingReceiver()
    let monitoring = makeMonitoring(receiver: receiver)

    monitoring.markInteractive(routeName: "home", params: ["tenant": "acme", "cohort": 3])

    let metric = try await ttiMetric(from: receiver)
    let params = try #require(metric.params?.value as? [String: Any])
    #expect(params["tenant"] as? String == "acme")
    #expect(params["cohort"] as? Int == 3)
    #expect(metric.routeName == "home")
  }

  @Test
  func `emits nil params when no user params are provided and no frames were recorded`() async throws {
    let receiver = CapturingReceiver()
    let monitoring = makeMonitoring(receiver: receiver)

    monitoring.markInteractive()

    let metric = try await ttiMetric(from: receiver)
    #expect(metric.params == nil)
  }

  @Test
  func `overlays frame metrics on top of user params`() async throws {
    let receiver = CapturingReceiver()
    let monitoring = makeMonitoring(receiver: receiver)

    // Simulate one frozen frame so the recorder produces non-zero metrics.
    monitoring.frameMetricsRecorder.processFrame(frame(at: 1.0))
    monitoring.frameMetricsRecorder.processFrame(frame(at: 1.8))

    monitoring.markInteractive(params: ["tenant": "acme"])

    let metric = try await ttiMetric(from: receiver)
    let params = try #require(metric.params?.value as? [String: Any])
    #expect(params["tenant"] as? String == "acme")
    #expect(params["frameRate.slowFrames"] != nil)
    #expect(params["frameRate.frozenFrames"] != nil)
    #expect(params["frameRate.totalDelay"] != nil)
  }

  @Test
  func `frame metrics overwrite user-supplied frameRate keys on collision`() async throws {
    let receiver = CapturingReceiver()
    let monitoring = makeMonitoring(receiver: receiver)

    monitoring.frameMetricsRecorder.processFrame(frame(at: 1.0))
    monitoring.frameMetricsRecorder.processFrame(frame(at: 1.8))

    monitoring.markInteractive(params: ["frameRate.slowFrames": 999])

    let metric = try await ttiMetric(from: receiver)
    let params = try #require(metric.params?.value as? [String: Any])
    // The actual frame recorder produces slowFrames == 1, not 999.
    #expect((params["frameRate.slowFrames"] as? Int) != 999)
  }
}

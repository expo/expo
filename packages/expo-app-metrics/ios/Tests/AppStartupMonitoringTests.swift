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
    // Seed `NetworkPathMonitor.shared` so `markInteractive` doesn't suspend
    // forever waiting for the OS to deliver a real path in the test process.
    NetworkPathMonitor.shared.onNetworkPathUpdate(NetworkPath(
      status: .satisfied,
      interfaceType: .wifi,
      isExpensive: false,
      isConstrained: false,
      unsatisfiedReason: nil,
      timestamp: 0
    ))
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
  func `always attaches device and network params even with no user params`() async throws {
    let receiver = CapturingReceiver()
    let monitoring = makeMonitoring(receiver: receiver)

    monitoring.markInteractive()

    let metric = try await ttiMetric(from: receiver)
    let params = try #require(metric.params?.value as? [String: Any])
    #expect(params["expo.device.lowPowerMode"] != nil)
    #expect(params["expo.device.thermalState"] != nil)
    #expect(params["expo.network.connected"] != nil)
    #expect(params["expo.network.type"] != nil)
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
    #expect(params["expo.frameRate.slowFrames"] != nil)
    #expect(params["expo.frameRate.frozenFrames"] != nil)
    #expect(params["expo.frameRate.totalDelay"] != nil)
  }

  @Test
  func `framework-emitted params override user-supplied params on key collision`() async throws {
    let receiver = CapturingReceiver()
    let monitoring = makeMonitoring(receiver: receiver)

    monitoring.frameMetricsRecorder.processFrame(frame(at: 1.0))
    monitoring.frameMetricsRecorder.processFrame(frame(at: 1.8))

    monitoring.markInteractive(params: [
      "expo.frameRate.slowFrames": 999,
      "expo.device.lowPowerMode": "user-supplied"
    ])

    let metric = try await ttiMetric(from: receiver)
    let params = try #require(metric.params?.value as? [String: Any])
    // The actual frame recorder produces slowFrames == 1, not 999.
    #expect((params["expo.frameRate.slowFrames"] as? Int) != 999)
    // Device params come from the OS, not the user-supplied string.
    #expect(params["expo.device.lowPowerMode"] is Bool)
  }
}

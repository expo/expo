import QuartzCore
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
    monitoring.markers.finishedLaunching = CACurrentMediaTime()
    monitoring.addReceiver(receiver)
    // Seed `NetworkPathMonitor.shared` so `markInteractive` doesn't suspend
    // forever waiting for the OS to deliver a real path in the test process.
    NetworkPathMonitor.shared.onNetworkPathUpdate(
      NetworkPath(
        status: .satisfied,
        interfaceType: .wifi,
        isExpensive: false,
        isConstrained: false,
        unsatisfiedReason: nil,
        timestamp: 0
      )
    )
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

  /// Waits until the dispatched tasks bring the monitoring to a state that satisfies the condition.
  private func waitUntil(_ condition: () -> Bool) async throws {
    for _ in 0..<20 {
      if condition() {
        return
      }
      try await Task.sleep(for: .milliseconds(10))
    }
    Issue.record("Timed out waiting for the condition")
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
      "expo.device.lowPowerMode": "user-supplied",
    ])

    let metric = try await ttiMetric(from: receiver)
    let params = try #require(metric.params?.value as? [String: Any])
    // The actual frame recorder produces slowFrames == 1, not 999.
    #expect((params["expo.frameRate.slowFrames"] as? Int) != 999)
    // Device params come from the OS, not the user-supplied string.
    #expect(params["expo.device.lowPowerMode"] is Bool)
  }

  @Test
  func `skips startup metrics when the app is launched in the background`() async throws {
    let receiver = CapturingReceiver()
    let monitoring = makeMonitoring(receiver: receiver)

    await monitoring.markDidFinishLaunching(runningInBackground: true)
    // `markDidFinishLaunching` dispatches via `Task {}`, so wait for it before marking the next steps.
    try await waitUntil { monitoring.startupState == .interrupted }
    monitoring.markFirstRender()
    monitoring.markInteractive()

    // Give the dispatched tasks a chance to run before asserting nothing was reported.
    try await Task.sleep(for: .milliseconds(100))
    #expect(monitoring.startupState == .interrupted)
    #expect(receiver.metrics.isEmpty)
  }

  @Test
  func `reports startup metrics when the app is launched in the foreground`() async throws {
    let receiver = CapturingReceiver()
    let monitoring = makeMonitoring(receiver: receiver)

    await monitoring.markDidFinishLaunching(runningInBackground: false)
    try await waitUntil { monitoring.markers.finishedLaunchingDate != nil }
    #expect(monitoring.startupState == .launching)
    monitoring.markInteractive()

    _ = try await ttiMetric(from: receiver)
    #expect(monitoring.startupState == .launched)
  }

  @Test
  func `skips TTR and TTI that exceed the max startup duration`() async throws {
    let receiver = CapturingReceiver()
    let monitoring = makeMonitoring(receiver: receiver)
    monitoring.markers.finishedLaunching = CACurrentMediaTime() - 10 * 60

    monitoring.markFirstRender()
    try await waitUntil { monitoring.startupState == .interrupted }
    monitoring.markInteractive()

    // Give the dispatched tasks a chance to run before asserting nothing was reported.
    try await Task.sleep(for: .milliseconds(100))
    #expect(monitoring.startupState == .interrupted)
    #expect(!receiver.metrics.contains { $0.name == "timeToFirstRender" || $0.name == "timeToInteractive" })
  }

  @Test
  func `skips TTI that exceeds the max startup duration`() async throws {
    let receiver = CapturingReceiver()
    let monitoring = makeMonitoring(receiver: receiver)
    monitoring.markers.finishedLaunching = CACurrentMediaTime() - 10 * 60
    monitoring.markers.timeToFirstRender = monitoring.markers.finishedLaunching

    monitoring.markInteractive()

    try await waitUntil { monitoring.startupState == .interrupted }
    #expect(!receiver.metrics.contains { $0.name == "timeToInteractive" })
  }

  @Test
  func `emits the backgrounded event when the app enters the background during startup`() throws {
    let monitoring = makeMonitoring(receiver: CapturingReceiver())
    let finishedLaunching = try #require(monitoring.markers.finishedLaunching)
    monitoring.markers.timeToFirstRender = finishedLaunching + 1

    let record = try #require(monitoring.markEnteredBackground(at: finishedLaunching + 5))

    #expect(record.name == "expo.app_startup.backgrounded")
    #expect(monitoring.startupState == .interrupted)
    let attributes = try #require(record.attributes?.value as? [String: Any])
    let duration = try #require(attributes["expo.app_startup.duration"] as? Double)
    #expect(abs(duration - 5) < 0.001)
    #expect(attributes["expo.app_startup.hasRendered"] as? Bool == true)
    #expect(attributes["expo.app_startup.hasMarkedInteractive"] is Bool)
  }

  @Test
  func `skips the backgrounded event when the startup is no longer in progress`() {
    let monitoring = makeMonitoring(receiver: CapturingReceiver())

    for state in [AppStartupMonitoring.StartupState.launched, .interrupted] {
      monitoring.startupState = state
      #expect(monitoring.markEnteredBackground() == nil)
      #expect(monitoring.startupState == state)
    }
  }

  @Test
  func `skips the backgrounded event when the launch didn't finish`() {
    // For example a prewarmed launch, which doesn't set the `finishedLaunching` marker.
    let monitoring = makeMonitoring(receiver: CapturingReceiver())
    monitoring.markers.finishedLaunching = nil

    #expect(monitoring.markEnteredBackground() == nil)
    #expect(monitoring.startupState == .interrupted)
  }

  @Test
  func `skips the backgrounded event after the max startup duration`() throws {
    let monitoring = makeMonitoring(receiver: CapturingReceiver())
    let finishedLaunching = try #require(monitoring.markers.finishedLaunching)

    #expect(monitoring.markEnteredBackground(at: finishedLaunching + 10 * 60) == nil)
    #expect(monitoring.startupState == .interrupted)
  }
}

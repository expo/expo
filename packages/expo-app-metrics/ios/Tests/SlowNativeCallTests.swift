import ExpoModulesCore
import Foundation
import Testing

@testable import ExpoAppMetrics

@Suite("SlowNativeCall")
struct SlowNativeCallTests {
  private func slowSyncCall(
    owner: String = "MidiModule",
    name: String = "getOutputs",
    startedAt: TimeInterval = 10.4,
    duration: TimeInterval = 0.23
  ) -> SlowSyncCall {
    return SlowSyncCall(
      identity: SyncCallIdentity(ownerName: owner, name: name, kind: .function),
      startedAt: startedAt,
      duration: duration,
      onMainThread: false
    )
  }

  @Test
  func `is anchored to didFinishLaunching and names the module`() {
    let call = SlowNativeCall(call: slowSyncCall(), phase: "beforeFirstRender", anchor: 10.0)
    #expect(call.module == "MidiModule")
    #expect(call.function == "getOutputs")
    #expect(call.kind == "function")
    #expect(call.thread == "js")
    #expect(call.qualifiedName == "MidiModule.getOutputs")
    #expect(abs(call.startedAt - 0.4) < 0.0001)
    #expect(call.duration == 0.23)
  }

  @Test
  func `log record carries the call attributes`() throws {
    let call = SlowNativeCall(call: slowSyncCall(), phase: "beforeFirstRender", anchor: 10.0)
    let record = call.toLogRecord(timestamp: Date(timeIntervalSince1970: 1_700_000_000))
    let attributes = try #require(record.attributes?.value as? [String: Any])

    #expect(record.name == "native_module.slow_sync_call")
    #expect(record.severity == .warn)
    #expect(record.timestamp == "2023-11-14T22:13:20.000Z")
    #expect(attributes["expo.native_call.module"] as? String == "MidiModule")
    #expect(attributes["expo.native_call.function"] as? String == "getOutputs")
    #expect(attributes["expo.native_call.kind"] as? String == "function")
    #expect(attributes["expo.native_call.thread"] as? String == "js")
    #expect(attributes["expo.native_call.phase"] as? String == "beforeFirstRender")
    #expect(attributes["expo.native_call.started_at_ms"] as? Double == 400)
    #expect(attributes["expo.native_call.duration_ms"] as? Double == 230)
  }

  @Test
  func `summary keeps totals and the slowest call`() {
    var summary = SlowNativeCallSummary()
    #expect(summary.isEmpty)

    let phase = "beforeFirstRender"
    summary.add(SlowNativeCall(call: slowSyncCall(name: "getInputs", duration: 0.06), phase: phase, anchor: 0))
    summary.add(SlowNativeCall(call: slowSyncCall(name: "getOutputs", duration: 0.23), phase: phase, anchor: 0))
    let other = slowSyncCall(owner: "Other", name: "read", duration: 0.07)
    summary.add(SlowNativeCall(call: other, phase: phase, anchor: 0))

    #expect(summary.count == 3)
    #expect(abs(summary.totalDuration - 0.36) < 0.0001)
    #expect(summary.longestDuration == 0.23)
    #expect(summary.slowest == "MidiModule.getOutputs")
  }

  @Test
  func `summary is attached to metric params`() {
    var summary = SlowNativeCallSummary()
    summary.add(SlowNativeCall(call: slowSyncCall(), phase: "beforeFirstRender", anchor: 0))
    let params = MetricParamsBuilder.build(slowNativeCalls: summary)

    #expect(params["expo.startup.slowNativeCalls.count"] as? Int == 1)
    #expect(params["expo.startup.slowNativeCalls.totalDuration"] as? TimeInterval == 0.23)
    #expect(params["expo.startup.slowNativeCalls.longestDuration"] as? TimeInterval == 0.23)
    #expect(params["expo.startup.slowNativeCalls.slowest"] as? String == "MidiModule.getOutputs")
    #expect(MetricParamsBuilder.build(slowNativeCalls: SlowNativeCallSummary()).isEmpty)
  }

  private final class CapturingReceiver: MetricsReceiver, @unchecked Sendable {
    var logs: [LogRecord] = []

    @AppMetricsActor
    func receiveLog(_ log: LogRecord) {
      logs.append(log)
    }
  }

  @Test
  @AppMetricsActor
  func `startup monitoring logs each call and only sums the ones before TTI`() async throws {
    let receiver = CapturingReceiver()
    let monitoring = AppStartupMonitoring()
    monitoring.markers.finishedLaunching = 1.0
    monitoring.addReceiver(receiver)

    let startupCall = slowSyncCall(startedAt: 1.3, duration: 0.23)
    monitoring.recordSlowNativeCall(startupCall, phase: "beforeFirstRender", endedAt: Date())
    monitoring.startupState = .launched
    let laterCall = slowSyncCall(name: "later", startedAt: 5, duration: 0.12)
    monitoring.recordSlowNativeCall(laterCall, phase: "afterInteractive", endedAt: Date())

    #expect(monitoring.slowNativeCalls.count == 1)
    #expect(monitoring.slowNativeCalls.slowest == "MidiModule.getOutputs")

    // `reportLog` dispatches through a `Task`, so give it a moment to reach the receiver.
    for _ in 0..<20 where receiver.logs.count < 2 {
      try await Task.sleep(for: .milliseconds(10))
    }
    #expect(receiver.logs.map(\.name) == ["native_module.slow_sync_call", "native_module.slow_sync_call"])
    let attributes = try #require(receiver.logs.first?.attributes?.value as? [String: Any])
    #expect(attributes["expo.native_call.started_at_ms"] as? Double == 300)
  }
}

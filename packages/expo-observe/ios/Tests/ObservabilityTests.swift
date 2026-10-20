import ExpoAppMetrics
import Testing

@testable import ExpoObserve

@Suite("Observability.shouldDispatch")
struct ObservabilityShouldDispatchTests {
  @Test
  func `isDev true with dispatchInDebug false returns false`() {
    let result = ObservabilityManager.shouldDispatch(
      config: PersistedConfig(dispatchingEnabled: true, dispatchInDebug: false),
      isDev: true,
      isInSample: true
    )
    #expect(result == false)
  }

  @Test
  func `isDev true with dispatchInDebug true returns true`() {
    let result = ObservabilityManager.shouldDispatch(
      config: PersistedConfig(dispatchingEnabled: true, dispatchInDebug: true),
      isDev: true,
      isInSample: true
    )
    #expect(result == true)
  }

  @Test
  func `isDev false with dispatchInDebug false returns true`() {
    let result = ObservabilityManager.shouldDispatch(
      config: PersistedConfig(dispatchingEnabled: true, dispatchInDebug: false),
      isDev: false,
      isInSample: true
    )
    #expect(result == true)
  }

  @Test
  func `isDev false with dispatchInDebug true returns true`() {
    let result = ObservabilityManager.shouldDispatch(
      config: PersistedConfig(dispatchingEnabled: true, dispatchInDebug: true),
      isDev: false,
      isInSample: true
    )
    #expect(result == true)
  }

  @Test
  func `dispatchingEnabled false returns false regardless of other gates`() {
    let result = ObservabilityManager.shouldDispatch(
      config: PersistedConfig(dispatchingEnabled: false, dispatchInDebug: true),
      isDev: false,
      isInSample: true
    )
    #expect(result == false)
  }

  @Test
  func `isInSample false returns false`() {
    let result = ObservabilityManager.shouldDispatch(
      config: PersistedConfig(dispatchingEnabled: true, dispatchInDebug: false),
      isDev: false,
      isInSample: false
    )
    #expect(result == false)
  }

  @Test
  func `nil config defaults dispatchingEnabled true and dispatchInDebug false`() {
    #expect(
      ObservabilityManager.shouldDispatch(config: nil, isDev: false, isInSample: true) == true
    )
    #expect(
      ObservabilityManager.shouldDispatch(config: nil, isDev: true, isInSample: true) == false
    )
  }
}

@Suite("Observability.sampledLogs")
struct ObservabilitySampledLogsTests {
  private let logs = ["info", "js.exception", "native.exception"].map {
    LogRow(sessionId: "s", timestamp: "2025-01-01T00:00:00Z", severity: "error", name: $0)
  }

  @Test
  func `only errors in-sample keeps only exception logs`() {
    let result = ObservabilityManager.sampledLogs(logs, shouldDispatch: false, shouldDispatchErrors: true)
    #expect(result.map(\.name) == ["js.exception", "native.exception"])
  }

  @Test
  func `errors out-of-sample drops exception logs`() {
    let result = ObservabilityManager.sampledLogs(logs, shouldDispatch: true, shouldDispatchErrors: false)
    #expect(result.map(\.name) == ["info"])
  }
}

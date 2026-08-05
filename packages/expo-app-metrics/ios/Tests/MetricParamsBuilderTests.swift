import Foundation
import Testing

@testable import ExpoAppMetrics

@Suite("MetricParamsBuilder")
struct MetricParamsBuilderTests {
  private let satisfiedWifi = NetworkPath(
    status: .satisfied,
    interfaceType: .wifi,
    isExpensive: false,
    isConstrained: false,
    unsatisfiedReason: nil,
    timestamp: 0
  )

  private let unsatisfied = NetworkPath(
    status: .unsatisfied,
    interfaceType: .none,
    isExpensive: false,
    isConstrained: false,
    unsatisfiedReason: .notAvailable,
    timestamp: 0
  )

  @Test
  func `returns empty map when all inputs are nil`() {
    let params = MetricParamsBuilder.build()
    #expect(params.isEmpty)
  }

  @Test
  func `omits network keys when networkPath is nil`() {
    let params = MetricParamsBuilder.build(userParams: ["tenant": "acme"])
    #expect(params["expo.network.connected"] == nil)
    #expect(params["expo.network.type"] == nil)
  }

  @Test
  func `passes user params through unchanged`() {
    let params = MetricParamsBuilder.build(userParams: ["tenant": "acme", "cohort": 3])
    #expect(params["tenant"] as? String == "acme")
    #expect(params["cohort"] as? Int == 3)
  }

  @Test
  func `maps satisfied wifi path to connected wifi keys`() {
    let params = MetricParamsBuilder.build(networkPath: satisfiedWifi)
    #expect(params["expo.network.connected"] as? Bool == true)
    #expect(params["expo.network.type"] as? String == "wifi")
  }

  @Test
  func `maps unsatisfied path to disconnected none keys`() {
    let params = MetricParamsBuilder.build(networkPath: unsatisfied)
    #expect(params["expo.network.connected"] as? Bool == false)
    #expect(params["expo.network.type"] as? String == "none")
  }

  @Test
  func `omits frame keys when expectedFrames is zero`() {
    let frameMetrics = FrameRateMetrics.zero
    let params = MetricParamsBuilder.build(frameMetrics: frameMetrics)
    #expect(params["expo.frameRate.slowFrames"] == nil)
    #expect(params["expo.frameRate.frozenFrames"] == nil)
    #expect(params["expo.frameRate.totalDelay"] == nil)
  }

  @Test
  func `emits frame keys when expectedFrames is positive`() {
    let frameMetrics = FrameRateMetrics(
      renderedFrames: 10,
      expectedFrames: 12,
      droppedFrames: 2,
      frozenFrames: 1,
      slowFrames: 3,
      freezeTime: 0.4,
      sessionDuration: 1.0
    )
    let params = MetricParamsBuilder.build(frameMetrics: frameMetrics)
    #expect(params["expo.frameRate.slowFrames"] as? UInt == 3)
    #expect(params["expo.frameRate.frozenFrames"] as? UInt == 1)
    #expect(params["expo.frameRate.totalDelay"] as? TimeInterval == 0.4)
  }

  @Test
  func `emits all device keys when DeviceState fields are populated`() {
    let deviceState = DeviceState(
      lowPowerMode: true,
      thermalState: .serious,
      batteryLevel: 0.42,
      batteryCharging: false
    )
    let params = MetricParamsBuilder.build(deviceState: deviceState)
    #expect(params["expo.device.lowPowerMode"] as? Bool == true)
    #expect(params["expo.device.thermalState"] as? String == "serious")
    #expect(params["expo.device.batteryLevel"] as? Double == 0.42)
    #expect(params["expo.device.batteryCharging"] as? Bool == false)
  }

  @Test
  func `omits device keys when DeviceState fields are nil`() {
    let deviceState = DeviceState(
      lowPowerMode: nil,
      thermalState: nil,
      batteryLevel: nil,
      batteryCharging: nil
    )
    let params = MetricParamsBuilder.build(deviceState: deviceState)
    #expect(params["expo.device.lowPowerMode"] == nil)
    #expect(params["expo.device.thermalState"] == nil)
    #expect(params["expo.device.batteryLevel"] == nil)
    #expect(params["expo.device.batteryCharging"] == nil)
  }

  @Test
  func `omits network request keys when summary is nil`() {
    let params = MetricParamsBuilder.build(userParams: ["tenant": "acme"])
    #expect(params["expo.network.requests.count"] == nil)
    #expect(params["expo.network.requests.slowestHost"] == nil)
  }

  @Test
  func `omits network request keys when summary is empty`() {
    let params = MetricParamsBuilder.build(networkRequests: .empty)
    #expect(params["expo.network.requests.count"] == nil)
  }

  @Test
  func `emits all network request keys when summary has data`() {
    let summary = NetworkRequestSummary(
      count: 4,
      failed: 1,
      bytesReceived: 12_000,
      bytesSent: 800,
      totalDuration: 1.4,
      slowestDuration: 0.6,
      slowestHost: "api.expo.dev"
    )
    let params = MetricParamsBuilder.build(networkRequests: summary)
    #expect(params["expo.network.requests.count"] as? Int == 4)
    #expect(params["expo.network.requests.failed"] as? Int == 1)
    #expect(params["expo.network.requests.bytesReceived"] as? Int64 == 12_000)
    #expect(params["expo.network.requests.bytesSent"] as? Int64 == 800)
    #expect(params["expo.network.requests.totalDuration"] as? TimeInterval == 1.4)
    #expect(params["expo.network.requests.slowestDuration"] as? TimeInterval == 0.6)
    #expect(params["expo.network.requests.slowestHost"] as? String == "api.expo.dev")
  }

  @Test
  func `framework-emitted device keys override user-supplied ones on collision`() {
    let deviceState = DeviceState(
      lowPowerMode: true,
      thermalState: nil,
      batteryLevel: nil,
      batteryCharging: nil
    )
    let params = MetricParamsBuilder.build(
      userParams: ["expo.device.lowPowerMode": "user-supplied"],
      deviceState: deviceState
    )
    #expect(params["expo.device.lowPowerMode"] as? Bool == true)
  }
}

// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/// Single source of truth for the `expo.*` keys we attach to metrics. Takes
/// typed inputs (`DeviceState`, `NetworkPath`, `FrameRateMetrics`) and produces
/// the flat `[String: Any]` map the metric envelope expects.
///
/// Framework-emitted keys override user-supplied keys on collision so the OS
/// readings always win — a user passing `expo.device.lowPowerMode: "yes"`
/// doesn't get to overwrite the actual OS bool.
enum MetricParamsBuilder {
  /// Builds the params map for a metric. All inputs are optional; any input
  /// that is `nil` simply contributes no keys.
  static func build(
    userParams: [String: Any] = [:],
    frameMetrics: FrameRateMetrics? = nil,
    deviceState: DeviceState? = nil,
    networkPath: NetworkPath? = nil,
    networkRequests: NetworkRequestSummary? = nil
  ) -> [String: Any] {
    var params: [String: Any] = userParams
    if let frameMetrics, frameMetrics.expectedFrames > 0 {
      params["expo.frameRate.slowFrames"] = frameMetrics.slowFrames
      params["expo.frameRate.frozenFrames"] = frameMetrics.frozenFrames
      params["expo.frameRate.totalDelay"] = frameMetrics.freezeTime
    }
    if let deviceState {
      if let lowPowerMode = deviceState.lowPowerMode {
        params["expo.device.lowPowerMode"] = lowPowerMode
      }
      if let thermalState = deviceState.thermalState {
        // Raw values on `DeviceState.ThermalState` are part of the wire
        // contract — see the enum's docs. Don't rename cases.
        params["expo.device.thermalState"] = thermalState.rawValue
      }
      if let batteryLevel = deviceState.batteryLevel {
        params["expo.device.batteryLevel"] = batteryLevel
      }
      if let batteryCharging = deviceState.batteryCharging {
        params["expo.device.batteryCharging"] = batteryCharging
      }
    }
    if let networkPath {
      params["expo.network.connected"] = networkPath.status == .satisfied
      params["expo.network.type"] = networkTypeString(networkPath)
      // Only when there's a network to describe. `NWPath` reports both as `false` on an unsatisfied
      // path, which would assert the connection wasn't metered rather than admit there wasn't one.
      // Android withholds its equivalents in the same situation.
      if networkPath.status == .satisfied {
        params["expo.network.isExpensive"] = networkPath.isExpensive
        params["expo.network.isConstrained"] = networkPath.isConstrained
      }
    }
    if let networkRequests, !networkRequests.isEmpty {
      params["expo.network.requests.count"] = networkRequests.count
      params["expo.network.requests.failed"] = networkRequests.failed
      // Emitted even at zero, unlike the optional latency fields below: we saw requests and none of
      // them timed out, which is a real measurement rather than a missing one.
      params["expo.network.requests.timedOut"] = networkRequests.timedOut
      params["expo.network.requests.bytesReceived"] = networkRequests.bytesReceived
      params["expo.network.requests.bytesSent"] = networkRequests.bytesSent
      params["expo.network.requests.totalDuration"] = networkRequests.totalDuration
      if let slowest = networkRequests.slowest {
        params["expo.network.requests.slowest.duration"] = slowest.duration
        if let host = slowest.host {
          params["expo.network.requests.slowest.host"] = host
        }
        if let statusCode = slowest.statusCode {
          params["expo.network.requests.slowest.statusCode"] = statusCode
        }
        if let timeToFirstByte = slowest.timeToFirstByte {
          params["expo.network.requests.slowest.timeToFirstByte"] = timeToFirstByte
        }
        if let bytesReceived = slowest.bytesReceived {
          params["expo.network.requests.slowest.bytesReceived"] = bytesReceived
        }
      }
      // Omitted rather than zeroed when unavailable: a window of cache hits never measured this, and
      // a 0 would read as "instant" on a dashboard.
      if let throughputBytesPerSecond = networkRequests.throughputBytesPerSecond {
        params["expo.network.requests.throughputBytesPerSecond"] = throughputBytesPerSecond
      }
    }
    return params
  }

  private static func networkTypeString(_ path: NetworkPath) -> String {
    if path.status != .satisfied {
      return "none"
    }
    switch path.interfaceType {
    case .wifi:
      return "wifi"
    case .cellular:
      return "cellular"
    case .ethernet:
      return "ethernet"
    case .other, .none:
      return "other"
    }
  }
}

// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/**
 Single source of truth for the `expo.*` keys we attach to metrics. Takes
 typed inputs (`DeviceState`, `NetworkPath`, `FrameRateMetrics`) and produces
 the flat `[String: Any]` map the metric envelope expects.

 Framework-emitted keys override user-supplied keys on collision so the OS
 readings always win — a user passing `expo.device.lowPowerMode: "yes"`
 doesn't get to overwrite the actual OS bool.
 */
enum MetricParamsBuilder {
  /**
   Builds the params map for a metric. All inputs are optional; any input
   that is `nil` simply contributes no keys.
   */
  static func build(
    userParams: [String: Any] = [:],
    frameMetrics: FrameRateMetrics? = nil,
    deviceState: DeviceState? = nil,
    networkPath: NetworkPath? = nil
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
        params["expo.device.thermalState"] = thermalState.rawValue
      }
      if let batteryLevel = deviceState.batteryLevel {
        params["expo.device.batteryLevel"] = batteryLevel
      }
      if let batteryCharging = deviceState.batteryCharging {
        params["expo.device.batteryCharging"] = batteryCharging
      }
    }
    params["expo.network.connected"] = networkPath?.status == .satisfied
    params["expo.network.type"] = networkTypeString(networkPath)
    return params
  }

  private static func networkTypeString(_ path: NetworkPath?) -> String {
    guard let path else {
      return "unknown"
    }
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

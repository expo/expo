// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 Snapshots of the device's environment (power, thermals, connectivity) attached
 to metrics like `timeToInteractive` so regressions can be correlated with
 conditions outside the app's control.
 */
enum DeviceConditions {
  /**
   Reads device power and thermal state and returns them as a flat dictionary
   keyed with `expo.device.*`. Returned keys are omitted (rather than emitting
   sentinel values like `-1` or `.unknown`) when the OS does not report a
   meaningful value — typically the Simulator, or the brief window after
   battery monitoring is first enabled before the first reading is published.

   Pinned to `@MainActor` because `UIDevice` is part of UIKit and its
   battery state/level reads are not documented as thread-safe. `ProcessInfo`
   reads (low-power mode, thermal state) are thread-safe in isolation, but
   we pin the whole helper for simplicity at the cost of one main-actor hop.
   */
  @MainActor
  static func deviceParams() -> [String: any Sendable] {
    var params: [String: any Sendable] = [:]

    params["expo.device.lowPowerMode"] = ProcessInfo.processInfo.isLowPowerModeEnabled
    params["expo.device.thermalState"] = thermalStateString(ProcessInfo.processInfo.thermalState)

#if !os(tvOS)
    // tvOS devices are wall-powered, so `UIDevice` doesn't expose battery
    // state/level there. Skip the battery section entirely on that platform.
    let device = UIDevice.current
    // Battery readings require `isBatteryMonitoringEnabled = true`. We turn it
    // on once and leave it on rather than save/restore it around the read:
    // the flag is a singleton on `UIDevice.current`, and a deferred restore
    // would race with anything else in the app that has it enabled (their
    // notifications would silently stop firing). Leaving it on has no
    // observable cost — the OS only delivers battery notifications to
    // explicit listeners, of which we have none.
    if !device.isBatteryMonitoringEnabled {
      device.isBatteryMonitoringEnabled = true
    }

    let level = device.batteryLevel
    if level >= 0 {
      params["expo.device.batteryLevel"] = Double(level)
    }

    switch device.batteryState {
    case .charging, .full:
      params["expo.device.batteryCharging"] = true
    case .unplugged:
      params["expo.device.batteryCharging"] = false
    case .unknown:
      break
    @unknown default:
      break
    }
#endif

    return params
  }

  /**
   Reads `expo.network.connected` and `expo.network.type` from the snapshot
   maintained by `NetworkPathMonitor`. Awaits the monitor's first path
   delivery if it hasn't arrived yet — the TTI value is captured from a
   synchronously-recorded timestamp before we get here, so the await only
   delays the local-storage write, not the metric itself.
   */
  @AppMetricsActor
  static func networkParams() async -> [String: any Sendable] {
    let path = await NetworkPathMonitor.shared.waitForFirstPath()
    return [
      "expo.network.connected": path?.status == .satisfied,
      "expo.network.type": networkTypeString(path)
    ]
  }

  private static func thermalStateString(_ state: ProcessInfo.ThermalState) -> String {
    switch state {
    case .nominal:
      return "nominal"
    case .fair:
      return "fair"
    case .serious:
      return "serious"
    case .critical:
      return "critical"
    @unknown default:
      return "unknown"
    }
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

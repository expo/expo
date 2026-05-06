// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Network

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
   Reads the current network path synchronously via a short-lived `NWPathMonitor`
   and returns `expo.network.connected` and `expo.network.type`. The monitor is
   cancelled before returning so the helper holds no system resources.
   */
  static func networkParams() -> [String: any Sendable] {
    let path = currentNetworkPath()
    var params: [String: any Sendable] = [
      "expo.network.connected": path?.status == .satisfied
    ]
    params["expo.network.type"] = networkTypeString(path)
    return params
  }

  private static func currentNetworkPath() -> NWPath? {
    let monitor = NWPathMonitor()
    let semaphore = DispatchSemaphore(value: 0)
    let queue = DispatchQueue(label: "expo.appmetrics.networkSnapshot")
    nonisolated(unsafe) var snapshot: NWPath?
    monitor.pathUpdateHandler = { path in
      snapshot = path
      semaphore.signal()
    }
    monitor.start(queue: queue)
    // NWPathMonitor delivers the initial path almost immediately (typically
    // sub-millisecond). 5ms is a generous upper bound that still keeps TTI
    // reporting on a tight budget.
    // TODO: Replace this short-lived monitor with a long-lived one started at
    // module init so the snapshot read is free and we don't block a
    // cooperative-pool thread.
    _ = semaphore.wait(timeout: .now() + .milliseconds(5))
    monitor.cancel()
    return snapshot
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

  private static func networkTypeString(_ path: NWPath?) -> String {
    guard let path else {
      return "unknown"
    }
    if path.status != .satisfied {
      return "none"
    }
    if path.usesInterfaceType(.wifi) {
      return "wifi"
    }
    if path.usesInterfaceType(.cellular) {
      return "cellular"
    }
    if path.usesInterfaceType(.wiredEthernet) {
      return "ethernet"
    }
    // `.loopback` is folded into `other`. The OS only reports loopback as the
    // primary interface when no real network is up (in which case the path is
    // already `.unsatisfied` above and we returned `none`) or in unusual
    // simulator configurations — neither case is operationally meaningful for
    // TTI, and dropping the value keeps the platform enums aligned.
    return "other"
  }
}

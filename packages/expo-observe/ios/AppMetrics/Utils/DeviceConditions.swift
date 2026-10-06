// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/// A `Sendable` snapshot of the device's power and thermal state. Fields are
/// optional so missing OS data (Simulator, brief windows where the OS hasn't
/// published a value yet) can be expressed as `nil` rather than a sentinel.
struct DeviceState: Sendable, Equatable {
  /// The raw values are part of the `expo.device.thermalState` wire contract
  /// — `MetricParamsBuilder` emits them via `.rawValue`. Don't rename cases.
  enum ThermalState: String, Sendable {
    case nominal
    case fair
    case serious
    case critical
    case unknown
  }

  let lowPowerMode: Bool?
  let thermalState: ThermalState?
  let batteryLevel: Double?
  let batteryCharging: Bool?
}

/// Reads the device's environment (power, thermals, battery) into a typed
/// `DeviceState`. The wire-format conversion to `expo.*` keys lives in
/// `MetricParamsBuilder`.
enum DeviceConditions {
  /// Reads device power, thermal, and battery state. Returned fields are `nil`
  /// when the OS does not report a meaningful value — typically the Simulator,
  /// or the brief window after battery monitoring is first enabled before the
  /// first reading is published.
  ///
  /// Pinned to `@MainActor` because `UIDevice` is part of UIKit and its
  /// battery state/level reads are not documented as thread-safe. `ProcessInfo`
  /// reads (low-power mode, thermal state) are thread-safe in isolation, but
  /// we pin the whole helper for simplicity at the cost of one main-actor hop.
  @MainActor
  static func deviceState() -> DeviceState {
    let lowPowerMode = ProcessInfo.processInfo.isLowPowerModeEnabled
    let thermalState = thermalState(from: ProcessInfo.processInfo.thermalState)

    #if os(tvOS)
    return DeviceState(
      lowPowerMode: lowPowerMode,
      thermalState: thermalState,
      batteryLevel: nil,
      batteryCharging: nil
    )
    #else
    // tvOS devices are wall-powered, so `UIDevice` doesn't expose battery
    // state/level there; the `#if` skips the battery section entirely.
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
    let batteryLevel: Double? = level >= 0 ? Double(level) : nil

    let batteryCharging: Bool? =
      switch device.batteryState {
      case .charging, .full: true
      case .unplugged: false
      case .unknown: nil
      @unknown default: nil
      }

    return DeviceState(
      lowPowerMode: lowPowerMode,
      thermalState: thermalState,
      batteryLevel: batteryLevel,
      batteryCharging: batteryCharging
    )
    #endif
  }

  private static func thermalState(from state: ProcessInfo.ThermalState) -> DeviceState.ThermalState {
    return switch state {
    case .nominal: .nominal
    case .fair: .fair
    case .serious: .serious
    case .critical: .critical
    @unknown default: .unknown
    }
  }
}

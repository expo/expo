// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing
import UIKit

@testable import ExpoBattery
@testable import ExpoModulesCore

// Serialized, since the modules of parallel tests would share the battery monitoring of `UIDevice`.
@Suite("BatteryModule", .serialized)
@JavaScriptActor
struct BatteryModuleTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(module: BatteryModule(appContext: appContext), name: nil)
  }

  // MARK: - Properties

  @Test
  func `isSupported is false on the simulator`() async throws {
    let isSupported = try await runtime.execute {
      try runtime.eval("expo.modules.ExpoBattery.isSupported").asBool()
    }
    #if targetEnvironment(simulator)
    #expect(isSupported == false)
    #else
    #expect(isSupported == true)
    #endif
  }

  // MARK: - Async functions

  @Test
  func `getBatteryLevelAsync resolves to the battery level of the device`() async throws {
    let expected = await MainActor.run { UIDevice.current.batteryLevel }

    let result = try await runtime.execute {
      try await runtime.evalAsync("expo.modules.ExpoBattery.getBatteryLevelAsync()").asDouble()
    }

    #expect(result == Double(expected))
  }

  @Test
  func `getBatteryStateAsync resolves to the raw value of the battery state`() async throws {
    let expected = await MainActor.run { UIDevice.current.batteryState.rawValue }

    let result = try await runtime.execute {
      try await runtime.evalAsync("expo.modules.ExpoBattery.getBatteryStateAsync()").asInt()
    }

    #expect(result == expected)
  }

  @Test
  func `isLowPowerModeEnabledAsync resolves to the low power mode of the device`() async throws {
    let result = try await runtime.execute {
      try await runtime.evalAsync("expo.modules.ExpoBattery.isLowPowerModeEnabledAsync()").asBool()
    }

    #expect(result == ProcessInfo.processInfo.isLowPowerModeEnabled)
  }

  // MARK: - Events

  @Test
  func `emits the battery level when the device posts a battery level change`() async throws {
    let expected = await MainActor.run { UIDevice.current.batteryLevel }
    try await addListener(event: "Expo.batteryLevelDidChange")

    await MainActor.run {
      NotificationCenter.default.post(name: UIDevice.batteryLevelDidChangeNotification, object: nil)
    }

    let payload = try await waitForPayload(event: "Expo.batteryLevelDidChange")
    let expectedPayload = try await runtime.execute {
      try runtime.eval("JSON.stringify({ batteryLevel: \(Double(expected)) })").asString()
    }
    #expect(payload == expectedPayload)
  }

  @Test
  func `emits the battery state when the device posts a battery state change`() async throws {
    let expected = await MainActor.run { UIDevice.current.batteryState.rawValue }
    try await addListener(event: "Expo.batteryStateDidChange")

    await MainActor.run {
      NotificationCenter.default.post(name: UIDevice.batteryStateDidChangeNotification, object: nil)
    }

    let payload = try await waitForPayload(event: "Expo.batteryStateDidChange")
    #expect(payload == #"{"batteryState":\#(expected)}"#)
  }

  @Test
  func `emits the low power mode when the system posts a power state change`() async throws {
    try await addListener(event: "Expo.powerModeDidChange")

    NotificationCenter.default.post(name: .NSProcessInfoPowerStateDidChange, object: nil)

    let payload = try await waitForPayload(event: "Expo.powerModeDidChange")
    #expect(payload == #"{"lowPowerMode":\#(ProcessInfo.processInfo.isLowPowerModeEnabled)}"#)
  }

  @Test
  func `stops emitting an event after its last listener is removed`() async throws {
    try await runtime.execute {
      try runtime.eval(
        """
        globalThis.payloads = {}
        expo.modules.ExpoBattery
          .addListener('Expo.batteryLevelDidChange', payload => { globalThis.payloads.level = payload })
          .remove()
        """
      )
    }
    try await addListener(event: "Expo.powerModeDidChange")

    await MainActor.run {
      NotificationCenter.default.post(name: UIDevice.batteryLevelDidChangeNotification, object: nil)
      NotificationCenter.default.post(name: .NSProcessInfoPowerStateDidChange, object: nil)
    }

    // The events reach JavaScript in the order they're emitted, so the battery level event would
    // arrive before the power mode event.
    _ = try await waitForPayload(event: "Expo.powerModeDidChange")
    let hasLevelPayload = try await runtime.execute {
      try runtime.eval("'level' in globalThis.payloads").asBool()
    }
    #expect(hasLevelPayload == false)
  }

  // MARK: - Helpers

  /// Adds a JavaScript listener that stores the JSON of the event payload under the event name.
  private func addListener(event: String) async throws {
    try await runtime.execute {
      try runtime.eval(
        """
        globalThis.payloads = globalThis.payloads || {}
        expo.modules.ExpoBattery.addListener('\(event)', payload => {
          globalThis.payloads['\(event)'] = JSON.stringify(payload)
        })
        """
      )
    }
  }

  /// Waits until a listener added with `addListener(event:)` receives a payload, and returns its JSON.
  private func waitForPayload(event: String) async throws -> String? {
    let deadline = Date().addingTimeInterval(2)
    while Date() < deadline {
      let payload = try await runtime.execute { () -> String? in
        let value = try runtime.eval("globalThis.payloads['\(event)']")
        return value.isUndefined() ? nil : try value.asString()
      }
      if let payload {
        return payload
      }
      try await Task.sleep(nanoseconds: 50_000_000)
    }
    return nil
  }
}

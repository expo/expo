// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing
import UIKit

@testable import ExpoBrightness
@testable import ExpoModulesCore

// The event tests post a notification that every module instance observes, so they must not overlap.
@Suite("BrightnessModule", .serialized)
@JavaScriptActor
struct BrightnessModuleTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(
      holder: ModuleHolder(
        appContext: appContext,
        module: BrightnessModule(appContext: appContext),
        name: "ExpoBrightness"
      )
    )
  }

  // MARK: - Permissions

  @Test(arguments: ["getPermissionsAsync", "requestPermissionsAsync"])
  func `permission functions resolve to a granted permission response`(functionName: String) async throws {
    let result = try await runtime.evalAsync(
      """
      expo.modules.ExpoBrightness.\(functionName)().then(response => JSON.stringify([
        response.status,
        response.granted,
        response.canAskAgain,
        response.expires,
      ]))
      """
    )

    #expect(try result.asString() == #"["granted",true,true,"never"]"#)
  }

  // MARK: - Events

  @Test
  func `emits the brightness change event with the screen brightness`() async throws {
    try await runtime.evalAsync(
      """
      globalThis.result = null
      expo.modules.ExpoBrightness.addListener('Expo.brightnessDidChange', event => {
        globalThis.result = event
      })
      """
    )

    let brightness = await MainActor.run {
      NotificationCenter.default.post(name: UIScreen.brightnessDidChangeNotification, object: nil)
      return Double(UIScreen.main.brightness)
    }

    var received: Double?
    try await waitUntil {
      let result = try await runtime.evalAsync("globalThis.result?.brightness ?? null")
      received = result.isNumber() ? try result.asDouble() : nil
      return received != nil
    }
    #expect(received == brightness)
  }

  @Test
  func `listeners for other event names do not change the brightness observer`() async throws {
    try await runtime.evalAsync(
      """
      globalThis.count = 0
      expo.modules.ExpoBrightness.addListener('Expo.brightnessDidChange', () => {
        globalThis.count += 1
      })
      globalThis.otherSubscription = expo.modules.ExpoBrightness.addListener('otherEvent', () => {})
      """
    )

    await postBrightnessChange()
    #expect(try await eventCount(reaching: 1) == 1)

    try await runtime.evalAsync("globalThis.otherSubscription.remove()")

    await postBrightnessChange()
    #expect(try await eventCount(reaching: 2) == 2)
  }

  private func postBrightnessChange() async {
    await MainActor.run {
      NotificationCenter.default.post(name: UIScreen.brightnessDidChangeNotification, object: nil)
    }
  }

  /// Waits until the listener count reaches `expected`, then waits a little longer so that a duplicate
  /// event also arrives before the count is returned.
  private func eventCount(reaching expected: Int) async throws -> Int {
    try await waitUntil {
      try await runtime.evalAsync("globalThis.count").asInt() >= expected
    }
    try await Task.sleep(nanoseconds: 200_000_000)
    return try await runtime.evalAsync("globalThis.count").asInt()
  }

  /// Polls `condition` until it is true or the timeout passes. Events reach JavaScript asynchronously,
  /// and a loaded CI machine can take much longer than a local run.
  private func waitUntil(timeout: TimeInterval = 5, _ condition: () async throws -> Bool) async throws {
    let deadline = Date().addingTimeInterval(timeout)
    while try await !condition() && Date() < deadline {
      try await Task.sleep(nanoseconds: 50_000_000)
    }
  }
}

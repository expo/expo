// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing
import UIKit

@testable import ExpoBrightness
@testable import ExpoModulesCore

@Suite("BrightnessModule")
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

    let deadline = Date().addingTimeInterval(2)
    var received: Double?
    while received == nil && Date() < deadline {
      try await Task.sleep(nanoseconds: 50_000_000)
      let result = try await runtime.evalAsync("globalThis.result?.brightness ?? null")
      received = result.isNumber() ? try result.asDouble() : nil
    }
    #expect(received == brightness)
  }
}

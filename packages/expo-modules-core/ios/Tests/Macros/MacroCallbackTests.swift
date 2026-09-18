// Copyright 2026-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

// MARK: - Test module

@ExpoModule
private final class MacroCallbackModule: Module {
  @JS
  func fire(onValue: Callback) {
    onValue(42)
  }

  @JS
  func fireLater(onValue: Callback) async throws {
    onValue("later")
  }
}

@Suite("Macro callback")
@JavaScriptActor
private struct MacroCallbackTests {
  let appContext: AppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = AppContext.create()
    appContext.moduleRegistry.register(module: MacroCallbackModule(appContext: appContext), name: nil)
  }

  @Test
  func `sync @JS function receives a Callback`() async throws {
    try runtime.eval("expo.modules.MacroCallbackModule.fire((value) => { globalThis.result = value })")
    try await expectEventually {
      guard let value = try? await self.runtime.eval("globalThis.result"), value.isNumber() else {
        return false
      }
      return try await value.asDouble() == 42
    }
  }

  @Test
  func `async @JS function receives a Callback`() async throws {
    try runtime.eval("expo.modules.MacroCallbackModule.fireLater((value) => { globalThis.result = value })")
    try await expectEventually {
      guard let value = try? await self.runtime.eval("globalThis.result"), value.isString() else {
        return false
      }
      return try await value.asString() == "later"
    }
  }
}

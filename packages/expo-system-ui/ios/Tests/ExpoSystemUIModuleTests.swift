// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore
@testable import ExpoSystemUI

@Suite("ExpoSystemUIModule")
@JavaScriptActor
struct ExpoSystemUIModuleTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(module: ExpoSystemUIModule(appContext: appContext), name: nil)
  }

  // The test bundle has no app window, so there is no background color to read.
  @Test
  func `getBackgroundColorAsync resolves to null without a window`() async throws {
    let isNull = try await runtime.execute {
      try await runtime.evalAsync("expo.modules.ExpoSystemUI.getBackgroundColorAsync()").isNull()
    }
    #expect(isNull)
  }

  @Test
  func `setBackgroundColorAsync resolves for null`() async throws {
    let isUndefined = try await runtime.execute {
      try await runtime.evalAsync("expo.modules.ExpoSystemUI.setBackgroundColorAsync(null)").isUndefined()
    }
    #expect(isUndefined)
  }
}

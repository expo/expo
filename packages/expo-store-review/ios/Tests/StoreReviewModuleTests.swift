// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore
@testable import ExpoStoreReview

@Suite("StoreReviewModule")
@JavaScriptActor
struct StoreReviewModuleTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(module: StoreReviewModule(appContext: appContext), name: nil)
  }

  @Test
  func `isAvailableAsync resolves to true on the simulator`() async throws {
    let result = try await runtime.execute {
      try await runtime.evalAsync("expo.modules.ExpoStoreReview.isAvailableAsync()").asBool()
    }
    #if targetEnvironment(simulator)
    #expect(result == true)
    #endif
  }

  // `requestReview` presents the system prompt in the foreground scene, which a unit test doesn't have.
  @Test
  func `requestReview is a function`() async throws {
    let type = try await runtime.execute {
      try runtime.eval("typeof expo.modules.ExpoStoreReview.requestReview").asString()
    }
    #expect(type == "function")
  }
}

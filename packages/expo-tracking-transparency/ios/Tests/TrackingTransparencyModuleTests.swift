// Copyright 2026-present 650 Industries. All rights reserved.

import AdSupport
import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore
@testable import ExpoTrackingTransparency

@Suite("TrackingTransparencyModule")
@JavaScriptActor
struct TrackingTransparencyModuleTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(module: TrackingTransparencyModule(appContext: appContext), name: nil)
  }

  @Test
  func `getAdvertisingId returns the advertising identifier`() async throws {
    let advertisingId = try await runtime.execute {
      try runtime.eval("expo.modules.ExpoTrackingTransparency.getAdvertisingId()").asString()
    }
    #expect(advertisingId == ASIdentifierManager.shared().advertisingIdentifier.uuidString)
  }

  @Test
  func `getAdvertisingIdAsync resolves to the advertising identifier`() async throws {
    let advertisingId = try await runtime.execute {
      try await runtime.evalAsync("expo.modules.ExpoTrackingTransparency.getAdvertisingIdAsync()").asString()
    }
    #expect(advertisingId == ASIdentifierManager.shared().advertisingIdentifier.uuidString)
  }

  @Test
  func `getPermissionsAsync resolves to an undetermined permission response`() async throws {
    let response = try await runtime.execute {
      try await runtime.evalAsync(
        """
        expo.modules.ExpoTrackingTransparency.getPermissionsAsync().then(response => JSON.stringify([
          response.status,
          response.granted,
          response.canAskAgain,
          response.expires,
        ]))
        """
      ).asString()
    }
    #expect(response == #"["undetermined",false,true,"never"]"#)
  }
}

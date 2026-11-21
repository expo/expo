// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import EASClient
@testable import ExpoModulesCore

@Suite("EASClientModule")
@JavaScriptActor
struct EASClientModuleTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(module: EASClientModule(appContext: appContext), name: nil)
  }

  @Test
  func `clientID is the stored client ID`() async throws {
    let clientID = try await runtime.execute {
      try runtime.eval("expo.modules.EASClient.clientID").asString()
    }
    #expect(clientID == EASClientID.uuid().uuidString)
  }

  @Test
  func `deterministicUniformValue is the uniform value of the stored client ID`() async throws {
    let value = try await runtime.execute {
      try runtime.eval("expo.modules.EASClient.deterministicUniformValue").asDouble()
    }
    #expect(value == EASClientID.deterministicUniformValue(EASClientID.uuid()))
  }
}

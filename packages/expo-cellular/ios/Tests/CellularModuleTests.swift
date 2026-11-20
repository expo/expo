// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoCellular
@testable import ExpoModulesCore

@Suite("CellularModule")
@JavaScriptActor
struct CellularModuleTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(module: CellularModule(appContext: appContext), name: nil)
  }

  @Test
  func `getCellularGenerationAsync resolves to the raw value of the current generation`() async throws {
    let expected = CellularModule.currentCellularGeneration().rawValue

    let result = try await runtime.execute {
      try await runtime.evalAsync("expo.modules.ExpoCellular.getCellularGenerationAsync()").asInt()
    }

    #expect(result == expected)
  }
}

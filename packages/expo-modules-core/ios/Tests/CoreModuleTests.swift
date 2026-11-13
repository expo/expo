// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("CoreModule")
@JavaScriptActor
struct CoreModuleTests {
  let appContext = AppContext.create()
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  @Test
  func `is initialized`() {
    #expect(appContext.coreModule != nil)
  }

  @Test
  func `core object is installed to global scope`() throws {
    let coreObjectValue = try runtime.eval("expo")
    #expect(coreObjectValue.kind == .object)
  }

  @Test
  func `installOnUIRuntime is a function on the core object`() throws {
    #expect(try runtime.eval("typeof expo.installOnUIRuntime").asString() == "function")
  }

  @Test
  func `installOnUIRuntime throws for a holder that is not an object`() throws {
    #expect(throws: (any Error).self) {
      _ = try runtime.eval("expo.installOnUIRuntime(1)")
    }
  }
}

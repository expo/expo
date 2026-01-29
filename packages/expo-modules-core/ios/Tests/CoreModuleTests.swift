// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("CoreModule")
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
}

// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
import ExpoModulesJSI

@testable import ExpoModulesCore

@Suite("JavaScriptCodable+Builtins")
@JavaScriptActor
struct JavaScriptCodableBuiltinsTests {
  let appContext = AppContext.create()

  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  // MARK: - JavaScriptValue passthrough

  @Test
  func `passes a JavaScriptValue through`() throws {
    let runtime = try runtime
    let value = try runtime.eval("123")
    let decoded = try JavaScriptValue.decode(value, in: runtime)
    #expect(decoded.getInt() == 123)
    let encoded = try JavaScriptValue.encode(decoded, in: runtime)
    #expect(encoded.getInt() == 123)
  }
}

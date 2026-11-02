// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

@Suite("JavaScriptUndefined")
@JavaScriptActor
struct JavaScriptUndefinedTests {
  let runtime = JavaScriptRuntime()

  @Test
  func `encodes to undefined`() throws {
    let encoded = try JavaScriptUndefined.encode(JavaScriptUndefined(), in: runtime)
    #expect(encoded.isUndefined() == true)
  }

  @Test
  func `decodes from an owning and a borrowed undefined`() throws {
    let value = try runtime.eval("undefined")
    _ = try JavaScriptUndefined.decode(value, in: runtime)
    _ = try value.withUnownedValue(in: runtime) { unownedValue in
      return try JavaScriptUndefined.decode(unownedValue, in: runtime)
    }
  }
}

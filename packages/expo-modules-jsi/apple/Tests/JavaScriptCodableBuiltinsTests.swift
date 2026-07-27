// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

@Suite("JavaScriptCodable+Builtins")
@JavaScriptActor
struct JavaScriptCodableBuiltinsTests {
  let runtime = JavaScriptRuntime()

  // MARK: - JavaScriptValue passthrough

  @Test
  func `passes a JavaScriptValue through`() throws {
    let value = try runtime.eval("123")
    let decoded = try JavaScriptValue.decode(value, in: runtime)
    #expect(decoded.getInt() == 123)
    let encoded = try JavaScriptValue.encode(decoded, in: runtime)
    #expect(encoded.getInt() == 123)
  }
}

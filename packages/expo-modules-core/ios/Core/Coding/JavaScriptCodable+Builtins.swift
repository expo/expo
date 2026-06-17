// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

// `JavaScriptCodable` conformance for the JS value passthrough.
//
// `Void` is intentionally not here: it is the empty tuple `()`, which cannot be extended to conform
// to a protocol (the same reason it is not `AnyArgument`). A `() -> Void` function's `undefined`
// return is emitted directly by the macro, which knows the return type statically.

// MARK: - JavaScriptValue (identity)

// A `JavaScriptValue` argument or return value is passed through unchanged — no conversion.
extension JavaScriptValue: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return value
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return value
  }
}

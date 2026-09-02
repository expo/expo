// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

// `JavaScriptCodable` conformance for `TypedArray`. Only the conformance declaration and `encode` live
// here; the `decode` witness is a `class func` in the class body (extension methods can't be
// overridden), and the concrete subclasses inherit the conformance and override `decode`. See
// `TypedArray.swift` / `ConcreteTypedArrays.swift`.

extension TypedArray: JavaScriptDecodable, JavaScriptEncodable {
  @JavaScriptActor
  @inlinable
  public static func encode(_ value: TypedArray, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    // No byte copy: the wrapper already owns the JS typed array, so hand the same object back.
    return value.jsTypedArray.asValue()
  }
}

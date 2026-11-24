// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

// `JavaScriptCodable` conformance for `TypedArray`. Only the conformance declaration and `encode` live
// here; the `decode` witness is a `class func` in the class body (extension methods can't be
// overridden), and the concrete subclasses inherit the conformance and override `decode`. See
// `TypedArray.swift` / `ConcreteTypedArrays.swift`.

extension TypedArray: JavaScriptDecodable, JavaScriptEncodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .object
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: TypedArray, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    guard value.jsTypedArray.belongs(to: runtime) else {
      throw TypedArrayInAnotherRuntimeException()
    }
    // No byte copy: the wrapper already owns the JS typed array, so hand the same object back.
    return value.jsTypedArray.asValue()
  }
}

@usableFromInline
internal final class TypedArrayInAnotherRuntimeException: Exception, @unchecked Sendable {
  override var reason: String {
    "Cannot convert a typed array to a value of another JavaScript runtime. A typed array belongs to the runtime that created it, for example the main runtime, and another runtime, for example the worklet UI runtime, can't use it. Pass the bytes as `Data` instead: it becomes a new `Uint8Array` in each runtime"
  }
}

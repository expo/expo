// Copyright 2026-present 650 Industries. All rights reserved.

/// The native counterpart of JavaScript's `undefined`. It encodes to `undefined` and decodes only from
/// `undefined`, so you can pass it wherever a `JavaScriptCodable` value is expected but there is no value
/// to send, for example as the payload of an event that carries none.
@frozen
public struct JavaScriptUndefined: JavaScriptCodable, Sendable {
  @inlinable
  public init() {}

  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .undefined
  }

  @JavaScriptActor
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptUndefined
  {
    guard value.isUndefined() else {
      throw JavaScriptValue.TypeError(type: JavaScriptUndefined.self)
    }
    return JavaScriptUndefined()
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: JavaScriptUndefined, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    return .undefined()
  }
}

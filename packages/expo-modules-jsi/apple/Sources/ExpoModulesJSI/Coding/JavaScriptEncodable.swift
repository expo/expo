// Copyright 2025-present 650 Industries. All rights reserved.

/// A protocol for types that can be converted to a JavaScript value without type erasure.
///
/// `encode` is static and takes the value explicitly so the macro emits one uniform call shape
/// — `T.encode(result, …)` — regardless of the type, and so types that represent absence
/// (e.g. `Optional`) can produce a JavaScript value without first having a non-nil `self`.
/// It is the native → JS half of `JavaScriptCodable`.
///
/// The conversion runs on the JavaScript thread; conformers are called under `@JavaScriptActor`.
/// See `JavaScriptDecodable` for why `runtime` is `borrowing`.
public protocol JavaScriptEncodable: ~Copyable {
  @JavaScriptActor
  static func encode(_ value: consuming Self, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue

  /// Encodes `value` straight into `slot`, for example an argument of a JavaScript function call or an
  /// element of a new array. See `JavaScriptValue.Slot` for what the encode must write.
  ///
  /// The default implementation moves the result of ``encode(_:in:)`` into the slot. Numbers, booleans,
  /// strings and optionals of them override it to construct the value in the slot: each move or destroy
  /// of a `JavaScriptValue` calls out-of-line `jsi::Value` code in the engine library, which costs more
  /// than the encode itself for these types.
  @JavaScriptActor
  static func encode(
    _ value: consuming Self,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws
}

extension JavaScriptEncodable where Self: ~Copyable {
  @JavaScriptActor
  @inlinable
  public static func encode(
    _ value: consuming Self,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    // The value is encoded in a closure that the slot calls, rather than passed to `emplace(_:)`: in a
    // client module `JavaScriptValue` is a resilient type that is handled through its type metadata, which
    // made `JavaScriptValuesBuffer.emplace(_:at:in:)` about 10% slower. The closure can't consume a
    // captured value, so the value moves out of an optional instead.
    var pending: Self? = .some(value)
    try slot.emplace {
      return try encode(pending.take()!, in: runtime)
    }
  }
}

// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/// A protocol for types that can be created from a JavaScript value without type erasure.
///
/// `decode` returns the concrete `Self` directly, so the macro-synthesized bindings that call it
/// never box the value as `Any` or cast it back with `as!`. It is the JS → native half of
/// `JavaScriptCodable`.
///
/// The conversion runs on the JavaScript thread; conformers are called under `@JavaScriptActor`.
/// The `runtime` is `borrowing` because the conversions only read it. A conversion that needs the
/// app context recovers it from the runtime with `AppContext.from(runtime:)`; one that needs to
/// store or escape that context makes an owned copy with `copy appContext`.
public protocol JavaScriptDecodable {
  /// Decodes an owning `JavaScriptValue` into `Self`.
  ///
  /// This overload is the protocol requirement: every conformer provides it. It is also the
  /// correct entry point for any value that must outlive the call (stored, captured, handed to a
  /// `Promise`).
  @JavaScriptActor
  static func decode(_ value: JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Self

  /// Decodes a non-owning `JavaScriptUnownedValue` into `Self` without copying the underlying
  /// `jsi::Value`.
  ///
  /// This is the argument-decode fast path: the value borrows the argument the
  /// `JavaScriptValuesBuffer` already owns for the duration of the call. It is defaulted (see the
  /// extension below), so conformers get it for free by materializing an owning value; types that
  /// can read straight from the borrowed value override it to stay zero-copy.
  @JavaScriptActor
  static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws -> Self
}

extension JavaScriptDecodable {
  /// Default fast-path implementation: materialize an owning value and forward to the requirement.
  /// This is the "explicitly copy" behavior for types that cannot (or need not) read directly from
  /// the borrowed value.
  ///
  /// `@inlinable` so the default specializes into the user module across the resilient
  /// (library-evolution) boundary instead of dispatching through the prebuilt binary.
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws -> Self {
    return try decode(value.copied(in: runtime), in: runtime)
  }
}

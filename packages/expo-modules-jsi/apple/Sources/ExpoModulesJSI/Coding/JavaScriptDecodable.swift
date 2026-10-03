// Copyright 2025-present 650 Industries. All rights reserved.

/// A protocol for types that can be created from a JavaScript value without type erasure.
///
/// `decode` returns the concrete `Self` directly, so the macro-synthesized bindings that call it
/// never box the value as `Any` or cast it back with `as!`. It is the JS → native half of
/// `JavaScriptCodable`.
///
/// The conversion runs on the JavaScript thread; conformers are called under `@JavaScriptActor`.
/// The `value` and `runtime` are `borrowing` because the conversions only read them; borrowing the
/// reference-typed `JavaScriptValue` also avoids a retain/release on every decode. A conversion that
/// needs to store or escape the runtime makes an owned copy with `copy runtime`.
public protocol JavaScriptDecodable {
  /// Decodes an owning `JavaScriptValue` into `Self`.
  ///
  /// Defaulted (see the extension below) to borrow the value and decode it through the
  /// `JavaScriptUnownedValue` overload, so a conformer may implement just that one. A conformer must
  /// implement at least one of the two overloads: each default forwards to the other, so with neither
  /// implemented a decode recurses until the stack overflows.
  @JavaScriptActor
  static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Self

  /// Decodes a non-owning `JavaScriptUnownedValue` into `Self` without copying the underlying
  /// `jsi::Value`.
  ///
  /// This is the argument-decode fast path: the value borrows the argument the
  /// `JavaScriptValuesBuffer` already owns for the duration of the call. It is defaulted (see the
  /// extension below) to materialize an owning value and decode that, for conformers that implement
  /// only the owning overload; types that can read straight from the borrowed value implement it to
  /// stay zero-copy.
  @JavaScriptActor
  static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws -> Self

  /// The kinds of JavaScript value `decode` can accept.
  ///
  /// A kind outside the set is definitive: `decode` would throw for a value of that kind. A kind in the
  /// set only means the type may decode it, so `decode` can still throw, for example for an
  /// out-of-range number or a missing record field. Code that picks between several types, like a
  /// union, reads it to skip the ones that can't match without paying for a thrown error. Defaults to
  /// `.all`, so a type that doesn't declare it is always tried.
  static var decodableKinds: JavaScriptValueKinds { get }
}

extension JavaScriptDecodable {
  /// Default owning decode: borrow the value and forward to the unowned overload, so a conformer that
  /// implements only that one decodes owning values without a copy.
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Self
  {
    let runtime = copy runtime
    return try value.withUnownedValue(in: runtime) { unownedValue in
      return try decode(unownedValue, in: runtime)
    }
  }

  /// Default fast-path implementation: materialize an owning value and forward to the requirement.
  /// This is the "explicitly copy" behavior for types that cannot (or need not) read directly from
  /// the borrowed value.
  ///
  /// `@inlinable` so the default specializes into the user module across the resilient
  /// (library-evolution) boundary instead of dispatching through the prebuilt binary.
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Self
  {
    return try decode(value.copied(in: runtime), in: runtime)
  }

  /// Default: every kind, so a conformer that doesn't declare its kinds is always tried.
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .all
  }
}

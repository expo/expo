// Copyright 2026-present 650 Industries. All rights reserved.

internal import jsi

/// A set of JavaScript value kinds, as told apart by the value's type tag alone.
///
/// Unlike `JavaScriptValue.Kind`, a function is an `object` here: telling it apart needs a call into
/// the runtime, while every kind in this set is read from the tag without one. Used by
/// `JavaScriptDecodable.decodableKinds` to describe the kinds a type can decode from. Frozen, so a check
/// against it compiles to a mask test in the client.
@frozen
public struct JavaScriptValueKinds: OptionSet, Sendable {
  public let rawValue: UInt16

  // `UInt16` leaves room for more kinds without changing the frozen layout.
  //
  // The kinds are computed and inlinable rather than stored `static let`s, which a client would reach
  // through a lazily initialized global, so a mask built from them folds to a constant.

  @inlinable
  public init(rawValue: UInt16) {
    self.rawValue = rawValue
  }

  @inlinable public static var undefined: JavaScriptValueKinds { JavaScriptValueKinds(rawValue: 1 << 0) }
  @inlinable public static var null: JavaScriptValueKinds { JavaScriptValueKinds(rawValue: 1 << 1) }
  @inlinable public static var bool: JavaScriptValueKinds { JavaScriptValueKinds(rawValue: 1 << 2) }
  @inlinable public static var number: JavaScriptValueKinds { JavaScriptValueKinds(rawValue: 1 << 3) }
  @inlinable public static var bigint: JavaScriptValueKinds { JavaScriptValueKinds(rawValue: 1 << 4) }
  @inlinable public static var string: JavaScriptValueKinds { JavaScriptValueKinds(rawValue: 1 << 5) }
  @inlinable public static var symbol: JavaScriptValueKinds { JavaScriptValueKinds(rawValue: 1 << 6) }
  /// Any object, including arrays, typed arrays and functions.
  @inlinable public static var object: JavaScriptValueKinds { JavaScriptValueKinds(rawValue: 1 << 7) }

  /// Every kind, including any added later: the bits above the current kinds are set too, so a type that
  /// accepts every kind keeps doing so.
  @inlinable public static var all: JavaScriptValueKinds { JavaScriptValueKinds(rawValue: .max) }

  /// The kind of `value`.
  ///
  /// Not inlinable on purpose: the type checks read the `jsi::Value`, which clients can't see, so an
  /// inlined initializer would make one call into this module per check. Here it is a single call.
  public init(of value: borrowing JavaScriptValue) {
    self.init(of: value.pointee)
  }

  /// The kind of the borrowed `value`, read the same way as from an owning value.
  public init(of value: borrowing JavaScriptUnownedValue) {
    self.init(of: value.pointer.pointee)
  }

  /// Reads the kind from the `jsi::Value` both public initializers wrap. The checks go from the most to
  /// the least common kind of an argument.
  private init(of value: borrowing facebook.jsi.Value) {
    if value.isNumber() {
      self = .number
    } else if value.isString() {
      self = .string
    } else if value.isObject() {
      self = .object
    } else if value.isBool() {
      self = .bool
    } else if value.isNull() {
      self = .null
    } else if value.isUndefined() {
      self = .undefined
    } else if value.isBigInt() {
      self = .bigint
    } else {
      self = .symbol
    }
  }
}

// Copyright 2025-present 650 Industries. All rights reserved.

import CoreGraphics
import ExpoModulesJSI

// `JavaScriptCodable` conformances for leaf primitive types — `Bool`, `String`, and the integer
// and floating-point families. Each reads a JavaScript value directly via the corresponding
// accessor with no recursion and no element conversion.
//
// `Data` is intentionally not here: it maps to a JS `Uint8Array`, not a scalar, and belongs with
// the typed-array conversions rather than these scalar primitives.
//
// Each conformance overrides the zero-copy `JavaScriptUnownedValue` decode overload so an
// argument is read straight from the borrowed value, never materializing a `JavaScriptValue`.

// MARK: - Bool

extension Bool: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Bool {
    return try value.asBool()
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Bool {
    return try value.asBool()
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Bool, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return value ? .true() : .false()
  }
}

// MARK: - String

extension String: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> String {
    return try value.asString()
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> String {
    return try value.asString()
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: String, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    // The `JavaScriptValue(_:_:)` initializer takes the runtime by owned convention (it stores it),
    // so an owned copy is needed from the borrowed parameter.
    return JavaScriptValue(copy runtime, value)
  }
}

// MARK: - Floating-point types

// Both overloads use the throwing `as*` accessors, never the non-throwing `get*`. Even though the
// Swift signature names a concrete type, the JavaScript caller is untyped and may pass anything, so
// the value's actual JS type is unknown until checked. `as*` turns a type mismatch into a thrown
// `TypeError`; `get*` only asserts (compiled out in release), so on a wrong-typed value it would be
// undefined behavior — a native crash, not a catchable error.

extension Double: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Double {
    return try value.asDouble()
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Double {
    return try value.asDouble()
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Double, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return .number(value)
  }
}

extension Float: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Float {
    return try Float(value.asDouble())
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Float {
    return try Float(value.asDouble())
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Float, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return .number(Double(value))
  }
}

extension CGFloat: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> CGFloat {
    return try CGFloat(value.asDouble())
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> CGFloat {
    return try CGFloat(value.asDouble())
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: CGFloat, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return .number(Double(value))
  }
}

// MARK: - Integer types
//
// JavaScript numbers are doubles. The narrow integer types (`Int8`...`Int32`, `UInt8`...`UInt32`) fit
// inside JavaScript's 2^53 safe-integer range, so each `decode` reads the value as a `Double` (throwing
// on a non-number) and narrows it through `decodeInteger`, which rounds to the nearest integer before
// converting (e.g. `1.6` decodes to `2`) and throws rather than traps on a non-finite or out-of-range
// value. Encoding widens back to `Double` for `.number`.
//
// The 64-bit types need more care because their range exceeds 2^53, where a `Double` can no longer
// represent every integer exactly:
//
// - `Int64`/`UInt64` always encode to a JS `bigint`. The type was chosen precisely because the full
//   64-bit range matters, so a lossy `.number` would defeat the point; `bigint` round-trips losslessly.
// - `Int`/`UInt` (64-bit on every platform Expo targets) are the everyday integer types and map to a JS
//   `number`. Keeping that mapping stable matters more than reaching the full 64-bit range here, so a
//   value within the safe-integer range encodes as a `number` and one beyond it throws rather than
//   silently switching the JS type to `bigint`. Code that needs the full range should use `Int64`/`UInt64`.
//
// All 64-bit `decode`s accept both a JS `number` and a JS `bigint`, so a value encoded as either reads
// back, and a JS caller may pass either form.

extension Int: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Int {
    return try decodeWideInteger(value, as: Int.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Int {
    return try decodeWideInteger(value, as: Int.self, runtime: runtime)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Int, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return try encodeSafeInteger(value)
  }
}

extension Int8: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Int8 {
    return try decodeInteger(value.asDouble(), as: Int8.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Int8 {
    return try decodeInteger(value.asDouble(), as: Int8.self)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Int8, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return .number(Double(value))
  }
}

extension Int16: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Int16 {
    return try decodeInteger(value.asDouble(), as: Int16.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Int16 {
    return try decodeInteger(value.asDouble(), as: Int16.self)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Int16, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return .number(Double(value))
  }
}

extension Int32: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Int32 {
    return try decodeInteger(value.asDouble(), as: Int32.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Int32 {
    return try decodeInteger(value.asDouble(), as: Int32.self)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Int32, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return .number(Double(value))
  }
}

extension Int64: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Int64 {
    return try decodeWideInteger(value, as: Int64.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Int64 {
    return try decodeWideInteger(value, as: Int64.self, runtime: runtime)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Int64, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return JavaScriptValue(copy runtime, bigInt: value)
  }
}

extension UInt: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> UInt {
    return try decodeWideInteger(value, as: UInt.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> UInt {
    return try decodeWideInteger(value, as: UInt.self, runtime: runtime)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: UInt, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return try encodeSafeInteger(value)
  }
}

extension UInt8: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> UInt8 {
    return try decodeInteger(value.asDouble(), as: UInt8.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> UInt8 {
    return try decodeInteger(value.asDouble(), as: UInt8.self)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: UInt8, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return .number(Double(value))
  }
}

extension UInt16: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> UInt16 {
    return try decodeInteger(value.asDouble(), as: UInt16.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> UInt16 {
    return try decodeInteger(value.asDouble(), as: UInt16.self)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: UInt16, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return .number(Double(value))
  }
}

extension UInt32: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> UInt32 {
    return try decodeInteger(value.asDouble(), as: UInt32.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> UInt32 {
    return try decodeInteger(value.asDouble(), as: UInt32.self)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: UInt32, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return .number(Double(value))
  }
}

extension UInt64: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> UInt64 {
    return try decodeWideInteger(value, as: UInt64.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> UInt64 {
    return try decodeWideInteger(value, as: UInt64.self, runtime: runtime)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: UInt64, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return JavaScriptValue(copy runtime, bigInt: value)
  }
}

/// Rounds a JavaScript number to the nearest integer and narrows it to `T`, throwing instead of
/// trapping when the value is non-finite or outside `T`'s representable range. `T(exactly:)` on the
/// already-rounded value is nil only when out of range, sidestepping the lossy `Double(T.max)`
/// boundary comparison for 64-bit widths.
@usableFromInline
@JavaScriptActor
func decodeInteger<T: FixedWidthInteger>(_ number: Double, as type: T.Type) throws -> T {
  guard number.isFinite, let result = T(exactly: number.rounded()) else {
    throw IntegerOutOfRangeException((value: number, type: "\(T.self)"))
  }
  return result
}

/// Decodes a 64-bit-wide integer that may arrive as either a JS `number` or a JS `bigint`. A `bigint`
/// is read losslessly through its 64-bit accessor; anything else falls back to the `Double` path so a
/// plain number still decodes (and rounds) exactly as the narrow integer types do.
@usableFromInline
@JavaScriptActor
func decodeWideInteger<T: FixedWidthInteger>(_ value: JavaScriptValue, as type: T.Type) throws -> T {
  guard value.isBigInt() else {
    return try decodeInteger(value.asDouble(), as: T.self)
  }
  return try decodeBigInt(value.getBigInt(), as: T.self)
}

/// `JavaScriptUnownedValue` overload of `decodeWideInteger`. The common `number` path stays zero-copy;
/// only a `bigint` materializes an owning value (the borrowed value exposes no BigInt accessor), which
/// is acceptable on this rare branch.
@usableFromInline
@JavaScriptActor
func decodeWideInteger<T: FixedWidthInteger>(
  _ value: borrowing JavaScriptUnownedValue,
  as type: T.Type,
  runtime: borrowing JavaScriptRuntime
) throws -> T {
  guard value.isBigInt() else {
    return try decodeInteger(value.asDouble(), as: T.self)
  }
  return try decodeBigInt(value.copied(in: copy runtime).getBigInt(), as: T.self)
}

/// Narrows a `JavaScriptBigInt` to `T`, reading it through the signed or unsigned 64-bit accessor to
/// match `T`'s signedness and throwing rather than truncating when it falls outside `T`'s range.
@usableFromInline
@JavaScriptActor
func decodeBigInt<T: FixedWidthInteger>(_ bigInt: borrowing JavaScriptBigInt, as type: T.Type) throws -> T {
  let wide: T? =
    if T.isSigned {
      bigInt.isInt64() ? T(exactly: bigInt.getInt64()) : nil
    } else {
      bigInt.isUint64() ? T(exactly: bigInt.getUint64()) : nil
    }
  guard let result = wide else {
    throw BigIntOutOfRangeException((value: (try? bigInt.toString()) ?? "<bigint>", type: "\(T.self)"))
  }
  return result
}

/// Encodes a 64-bit-wide integer to a JS `number`, throwing when it falls outside JavaScript's
/// safe-integer range where a `Double` could no longer represent it exactly. Used by `Int`/`UInt`,
/// whose JS mapping stays a `number`; the explicitly-sized 64-bit types encode as a `bigint` instead.
@usableFromInline
@JavaScriptActor
func encodeSafeInteger<T: FixedWidthInteger>(_ value: T) throws -> JavaScriptValue {
  // `Number.MAX_SAFE_INTEGER` (2^53 - 1): the largest magnitude where every integer up to it, and the
  // next one, is representable as a JS number. 2^53 itself is representable but unsafe (it collides with
  // 2^53 + 1), so the bound is exclusive above this. Used by `Int`/`UInt`, both 64-bit, so 2^53 fits.
  let maxSafeInteger: T.Magnitude = (1 << 53) - 1
  guard value.magnitude <= maxSafeInteger else {
    throw UnsafeIntegerException("\(value)")
  }
  return .number(Double(value))
}

/// Thrown when a JavaScript number cannot be represented as the target integer type because it is
/// non-finite or outside the type's range.
public final class IntegerOutOfRangeException: GenericException<(value: Double, type: String)>, @unchecked Sendable {
  override public var code: String {
    "ERR_INTEGER_OUT_OF_RANGE"
  }
  override public var reason: String {
    "JavaScript number '\(param.value)' cannot be represented as \(param.type)"
  }
}

/// Thrown when a JavaScript BigInt is outside the target integer type's range. The value is kept as a
/// string because an out-of-range BigInt is, by definition, not representable as a 64-bit integer.
public final class BigIntOutOfRangeException: GenericException<(value: String, type: String)>, @unchecked Sendable {
  override public var code: String {
    "ERR_BIGINT_OUT_OF_RANGE"
  }
  override public var reason: String {
    "JavaScript BigInt '\(param.value)' cannot be represented as \(param.type)"
  }
}

/// Thrown when an `Int`/`UInt` is encoded to a JS number but its magnitude exceeds JavaScript's
/// safe-integer range (`Number.MAX_SAFE_INTEGER`, 2^53 - 1), where a JS number can no longer represent
/// it exactly. Use `Int64`/`UInt64` to carry such values as a JS `bigint` without loss.
public final class UnsafeIntegerException: GenericException<String>, @unchecked Sendable {
  override public var code: String {
    "ERR_UNSAFE_INTEGER"
  }
  override public var reason: String {
    "Integer '\(param)' exceeds the range JavaScript can represent exactly; use Int64 or UInt64 to encode it as a BigInt"
  }
}

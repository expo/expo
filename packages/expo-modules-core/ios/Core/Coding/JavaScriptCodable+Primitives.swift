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
// JavaScript numbers are doubles. Each integer `decode` reads the value as a `Double` (throwing on a
// non-number) and narrows it through `decodeInteger`, which rounds to the nearest integer before
// converting (e.g. `1.6` decodes to `2`) and throws rather than traps on a non-finite or out-of-range
// value. Encoding widens back to `Double` for `.number`.
//
// TODO (encode side): widening to `Double` for `.number` silently loses precision for `Int64`/`UInt64`
// (and `Int`/`UInt` on 64-bit) magnitudes above 2^53, JavaScript's safe-integer ceiling. Routing wide
// integers through `BigInt` (which the JSI layer already models) would be lossless; left as a follow-up.

extension Int: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Int {
    return try decodeInteger(value.asDouble(), as: Int.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Int {
    return try decodeInteger(value.asDouble(), as: Int.self)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Int, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return .number(Double(value))
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
    return try decodeInteger(value.asDouble(), as: Int64.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Int64 {
    return try decodeInteger(value.asDouble(), as: Int64.self)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Int64, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return .number(Double(value))
  }
}

extension UInt: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> UInt {
    return try decodeInteger(value.asDouble(), as: UInt.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> UInt {
    return try decodeInteger(value.asDouble(), as: UInt.self)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: UInt, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return .number(Double(value))
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
    return try decodeInteger(value.asDouble(), as: UInt64.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> UInt64 {
    return try decodeInteger(value.asDouble(), as: UInt64.self)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: UInt64, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return .number(Double(value))
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

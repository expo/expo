// Copyright 2025-present 650 Industries. All rights reserved.

import CoreGraphics
internal import ExpoModulesJSI_Cxx
internal import jsi

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
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .bool
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Bool
  {
    return try value.asBool()
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Bool
  {
    return try value.asBool()
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Bool, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return value ? .true() : .false()
  }

  @JavaScriptActor
  @inlinable
  public static func encode(
    _ value: Bool,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    slot.emplace(bool: value)
  }
}

// MARK: - String

extension String: JavaScriptCodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .string
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> String
  {
    return try value.asString()
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> String
  {
    return try value.asString()
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: String, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    return JavaScriptValue(runtime, value)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(
    _ value: String,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    slot.emplace(string: value, in: runtime)
  }
}

// MARK: - Floating-point types

// Both overloads use the throwing `as*` accessors, never the non-throwing `get*`. Even though the
// Swift signature names a concrete type, the JavaScript caller is untyped and may pass anything, so
// the value's actual JS type is unknown until checked. `as*` turns a type mismatch into a thrown
// `TypeError`; `get*` only asserts (compiled out in release), so on a wrong-typed value it would be
// undefined behavior — a native crash, not a catchable error.

extension Double: JavaScriptCodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .number
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Double
  {
    return try value.asDouble()
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Double
  {
    return try value.asDouble()
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Double, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    return .number(value)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(
    _ value: Double,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    slot.emplace(number: value)
  }
}

extension Float: JavaScriptCodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .number
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Float
  {
    return try Float(value.asDouble())
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Float
  {
    return try Float(value.asDouble())
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Float, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return .number(Double(value))
  }

  @JavaScriptActor
  @inlinable
  public static func encode(
    _ value: Float,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    slot.emplace(number: Double(value))
  }
}

extension CGFloat: JavaScriptCodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .number
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> CGFloat
  {
    return try CGFloat(value.asDouble())
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> CGFloat
  {
    return try CGFloat(value.asDouble())
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: CGFloat, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    return .number(Double(value))
  }

  @JavaScriptActor
  @inlinable
  public static func encode(
    _ value: CGFloat,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    slot.emplace(number: Double(value))
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
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return [.number, .bigint]
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Int {
    return try decodeWideInteger(value, as: Int.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Int
  {
    return try decodeWideInteger(value, as: Int.self, runtime: runtime)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Int, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return try encodeSafeInteger(value)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(
    _ value: Int,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    slot.emplace(number: try safeIntegerNumber(value))
  }
}

extension Int8: JavaScriptCodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .number
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Int8
  {
    return try decodeInteger(value.asDouble(), as: Int8.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Int8
  {
    return try decodeInteger(value.asDouble(), as: Int8.self)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Int8, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return .number(Double(value))
  }

  @JavaScriptActor
  @inlinable
  public static func encode(
    _ value: Int8,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    slot.emplace(number: Double(value))
  }
}

extension Int16: JavaScriptCodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .number
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Int16
  {
    return try decodeInteger(value.asDouble(), as: Int16.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Int16
  {
    return try decodeInteger(value.asDouble(), as: Int16.self)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Int16, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return .number(Double(value))
  }

  @JavaScriptActor
  @inlinable
  public static func encode(
    _ value: Int16,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    slot.emplace(number: Double(value))
  }
}

extension Int32: JavaScriptCodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .number
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Int32
  {
    return try decodeInteger(value.asDouble(), as: Int32.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Int32
  {
    return try decodeInteger(value.asDouble(), as: Int32.self)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Int32, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return .number(Double(value))
  }

  @JavaScriptActor
  @inlinable
  public static func encode(
    _ value: Int32,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    slot.emplace(number: Double(value))
  }
}

extension Int64: JavaScriptCodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return [.number, .bigint]
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> Int64
  {
    return try decodeWideInteger(value, as: Int64.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Int64
  {
    return try decodeWideInteger(value, as: Int64.self, runtime: runtime)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Int64, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return JavaScriptValue(runtime, bigInt: value)
  }
}

extension UInt: JavaScriptCodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return [.number, .bigint]
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> UInt
  {
    return try decodeWideInteger(value, as: UInt.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> UInt
  {
    return try decodeWideInteger(value, as: UInt.self, runtime: runtime)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: UInt, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return try encodeSafeInteger(value)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(
    _ value: UInt,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    slot.emplace(number: try safeIntegerNumber(value))
  }
}

extension UInt8: JavaScriptCodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .number
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws -> UInt8
  {
    return try decodeInteger(value.asDouble(), as: UInt8.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> UInt8
  {
    return try decodeInteger(value.asDouble(), as: UInt8.self)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: UInt8, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return .number(Double(value))
  }

  @JavaScriptActor
  @inlinable
  public static func encode(
    _ value: UInt8,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    slot.emplace(number: Double(value))
  }
}

extension UInt16: JavaScriptCodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .number
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> UInt16
  {
    return try decodeInteger(value.asDouble(), as: UInt16.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> UInt16
  {
    return try decodeInteger(value.asDouble(), as: UInt16.self)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: UInt16, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    return .number(Double(value))
  }

  @JavaScriptActor
  @inlinable
  public static func encode(
    _ value: UInt16,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    slot.emplace(number: Double(value))
  }
}

extension UInt32: JavaScriptCodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .number
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> UInt32
  {
    return try decodeInteger(value.asDouble(), as: UInt32.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> UInt32
  {
    return try decodeInteger(value.asDouble(), as: UInt32.self)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: UInt32, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    return .number(Double(value))
  }

  @JavaScriptActor
  @inlinable
  public static func encode(
    _ value: UInt32,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    slot.emplace(number: Double(value))
  }
}

extension UInt64: JavaScriptCodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return [.number, .bigint]
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> UInt64
  {
    return try decodeWideInteger(value, as: UInt64.self)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> UInt64
  {
    return try decodeWideInteger(value, as: UInt64.self, runtime: runtime)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: UInt64, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    return JavaScriptValue(runtime, bigInt: value)
  }
}

// MARK: - Integer conversion entry points

// The numeric decode and safe-integer encode entry points are `@inlinable` so client modules can
// inline the common `number` fast path without a cross-module call. The decode overloads spell out
// `Int8(exactly:)`..`UInt64(exactly:)` concretely rather than delegating to an `@inlinable` generic
// helper: on a generic `FixedWidthInteger` parameter, `T(exactly:)` binds to the generic
// `BinaryFloatingPoint` initializer, which runs `_convert(from:)` even when fully specialized, while
// the concrete `init?(exactly: Double)` is a range check and one `fptosi`. The non-number
// fallback (`decodeWideIntegerNonNumber`) stays `@usableFromInline` and non-generic so the cold
// BigInt and error path stays out of line in the framework, specialized per integer type.

@inlinable
@JavaScriptActor
func decodeInteger(_ number: Double, as type: Int8.Type) throws -> Int8 {
  guard number.isFinite, let result = Int8(exactly: number.rounded()) else {
    throw IntegerOutOfRangeException(value: number, type: "Int8")
  }
  return result
}

@inlinable
@JavaScriptActor
func decodeInteger(_ number: Double, as type: Int16.Type) throws -> Int16 {
  guard number.isFinite, let result = Int16(exactly: number.rounded()) else {
    throw IntegerOutOfRangeException(value: number, type: "Int16")
  }
  return result
}

@inlinable
@JavaScriptActor
func decodeInteger(_ number: Double, as type: Int32.Type) throws -> Int32 {
  guard number.isFinite, let result = Int32(exactly: number.rounded()) else {
    throw IntegerOutOfRangeException(value: number, type: "Int32")
  }
  return result
}

@inlinable
@JavaScriptActor
func decodeInteger(_ number: Double, as type: UInt8.Type) throws -> UInt8 {
  guard number.isFinite, let result = UInt8(exactly: number.rounded()) else {
    throw IntegerOutOfRangeException(value: number, type: "UInt8")
  }
  return result
}

@inlinable
@JavaScriptActor
func decodeInteger(_ number: Double, as type: UInt16.Type) throws -> UInt16 {
  guard number.isFinite, let result = UInt16(exactly: number.rounded()) else {
    throw IntegerOutOfRangeException(value: number, type: "UInt16")
  }
  return result
}

@inlinable
@JavaScriptActor
func decodeInteger(_ number: Double, as type: UInt32.Type) throws -> UInt32 {
  guard number.isFinite, let result = UInt32(exactly: number.rounded()) else {
    throw IntegerOutOfRangeException(value: number, type: "UInt32")
  }
  return result
}

@inlinable
@JavaScriptActor
func decodeWideInteger(_ value: borrowing JavaScriptValue, as type: Int.Type) throws -> Int {
  guard let number = value.numberIfPresent() else {
    return try decodeWideIntegerNonNumber(value, as: Int.self)
  }
  guard number.isFinite, let result = Int(exactly: number.rounded()) else {
    throw IntegerOutOfRangeException(value: number, type: "Int")
  }
  return result
}

@inlinable
@JavaScriptActor
func decodeWideInteger(
  _ value: borrowing JavaScriptUnownedValue,
  as type: Int.Type,
  runtime: borrowing JavaScriptRuntime
) throws -> Int {
  guard let number = value.numberIfPresent() else {
    return try decodeWideIntegerNonNumber(value, as: Int.self, runtime: runtime)
  }
  guard number.isFinite, let result = Int(exactly: number.rounded()) else {
    throw IntegerOutOfRangeException(value: number, type: "Int")
  }
  return result
}

@inlinable
@JavaScriptActor
func decodeWideInteger(_ value: borrowing JavaScriptValue, as type: Int64.Type) throws -> Int64 {
  guard let number = value.numberIfPresent() else {
    return try decodeWideIntegerNonNumber(value, as: Int64.self)
  }
  guard number.isFinite, let result = Int64(exactly: number.rounded()) else {
    throw IntegerOutOfRangeException(value: number, type: "Int64")
  }
  return result
}

@inlinable
@JavaScriptActor
func decodeWideInteger(
  _ value: borrowing JavaScriptUnownedValue,
  as type: Int64.Type,
  runtime: borrowing JavaScriptRuntime
) throws -> Int64 {
  guard let number = value.numberIfPresent() else {
    return try decodeWideIntegerNonNumber(value, as: Int64.self, runtime: runtime)
  }
  guard number.isFinite, let result = Int64(exactly: number.rounded()) else {
    throw IntegerOutOfRangeException(value: number, type: "Int64")
  }
  return result
}

@inlinable
@JavaScriptActor
func decodeWideInteger(_ value: borrowing JavaScriptValue, as type: UInt.Type) throws -> UInt {
  guard let number = value.numberIfPresent() else {
    return try decodeWideIntegerNonNumber(value, as: UInt.self)
  }
  guard number.isFinite, let result = UInt(exactly: number.rounded()) else {
    throw IntegerOutOfRangeException(value: number, type: "UInt")
  }
  return result
}

@inlinable
@JavaScriptActor
func decodeWideInteger(
  _ value: borrowing JavaScriptUnownedValue,
  as type: UInt.Type,
  runtime: borrowing JavaScriptRuntime
) throws -> UInt {
  guard let number = value.numberIfPresent() else {
    return try decodeWideIntegerNonNumber(value, as: UInt.self, runtime: runtime)
  }
  guard number.isFinite, let result = UInt(exactly: number.rounded()) else {
    throw IntegerOutOfRangeException(value: number, type: "UInt")
  }
  return result
}

@inlinable
@JavaScriptActor
func decodeWideInteger(_ value: borrowing JavaScriptValue, as type: UInt64.Type) throws -> UInt64 {
  guard let number = value.numberIfPresent() else {
    return try decodeWideIntegerNonNumber(value, as: UInt64.self)
  }
  guard number.isFinite, let result = UInt64(exactly: number.rounded()) else {
    throw IntegerOutOfRangeException(value: number, type: "UInt64")
  }
  return result
}

@inlinable
@JavaScriptActor
func decodeWideInteger(
  _ value: borrowing JavaScriptUnownedValue,
  as type: UInt64.Type,
  runtime: borrowing JavaScriptRuntime
) throws -> UInt64 {
  guard let number = value.numberIfPresent() else {
    return try decodeWideIntegerNonNumber(value, as: UInt64.self, runtime: runtime)
  }
  guard number.isFinite, let result = UInt64(exactly: number.rounded()) else {
    throw IntegerOutOfRangeException(value: number, type: "UInt64")
  }
  return result
}

@usableFromInline
@JavaScriptActor
func decodeWideIntegerNonNumber(_ value: borrowing JavaScriptValue, as type: Int.Type) throws -> Int {
  return try genericDecodeWideNonNumber(value, as: Int.self)
}

@usableFromInline
@JavaScriptActor
func decodeWideIntegerNonNumber(
  _ value: borrowing JavaScriptUnownedValue,
  as type: Int.Type,
  runtime: borrowing JavaScriptRuntime
) throws -> Int {
  return try genericDecodeWideNonNumber(value, as: Int.self, runtime: runtime)
}

@usableFromInline
@JavaScriptActor
func decodeWideIntegerNonNumber(_ value: borrowing JavaScriptValue, as type: Int64.Type) throws -> Int64 {
  return try genericDecodeWideNonNumber(value, as: Int64.self)
}

@usableFromInline
@JavaScriptActor
func decodeWideIntegerNonNumber(
  _ value: borrowing JavaScriptUnownedValue,
  as type: Int64.Type,
  runtime: borrowing JavaScriptRuntime
) throws -> Int64 {
  return try genericDecodeWideNonNumber(value, as: Int64.self, runtime: runtime)
}

@usableFromInline
@JavaScriptActor
func decodeWideIntegerNonNumber(_ value: borrowing JavaScriptValue, as type: UInt.Type) throws -> UInt {
  return try genericDecodeWideNonNumber(value, as: UInt.self)
}

@usableFromInline
@JavaScriptActor
func decodeWideIntegerNonNumber(
  _ value: borrowing JavaScriptUnownedValue,
  as type: UInt.Type,
  runtime: borrowing JavaScriptRuntime
) throws -> UInt {
  return try genericDecodeWideNonNumber(value, as: UInt.self, runtime: runtime)
}

@usableFromInline
@JavaScriptActor
func decodeWideIntegerNonNumber(_ value: borrowing JavaScriptValue, as type: UInt64.Type) throws -> UInt64 {
  return try genericDecodeWideNonNumber(value, as: UInt64.self)
}

@usableFromInline
@JavaScriptActor
func decodeWideIntegerNonNumber(
  _ value: borrowing JavaScriptUnownedValue,
  as type: UInt64.Type,
  runtime: borrowing JavaScriptRuntime
) throws -> UInt64 {
  return try genericDecodeWideNonNumber(value, as: UInt64.self, runtime: runtime)
}

@inlinable
@JavaScriptActor
func encodeSafeInteger(_ value: Int) throws -> JavaScriptValue {
  return try genericEncodeSafeInteger(value)
}

@inlinable
@JavaScriptActor
func encodeSafeInteger(_ value: UInt) throws -> JavaScriptValue {
  return try genericEncodeSafeInteger(value)
}

@inlinable
@JavaScriptActor
func safeIntegerNumber(_ value: Int) throws -> Double {
  return try genericSafeIntegerNumber(value)
}

@inlinable
@JavaScriptActor
func safeIntegerNumber(_ value: UInt) throws -> Double {
  return try genericSafeIntegerNumber(value)
}

// MARK: - Generic integer conversions

@JavaScriptActor
private func bigIntExactly<T: FixedWidthInteger>(
  _ value: borrowing facebook.jsi.Value,
  in runtime: facebook.jsi.IRuntime,
  as type: T.Type
) -> T? {
  if T.isSigned {
    var int64Value: Int64 = 0
    return expo.getBigIntInt64(runtime, value, &int64Value) ? T(exactly: int64Value) : nil
  }
  var uint64Value: UInt64 = 0
  return expo.getBigIntUint64(runtime, value, &uint64Value) ? T(exactly: uint64Value) : nil
}

/// Decodes a non-number value into a 64-bit-wide integer. Reads a `bigint` straight from the
/// underlying `jsi::Value` without cloning its handle; anything else throws `TypeError`.
@JavaScriptActor
func genericDecodeWideNonNumber<T: FixedWidthInteger>(_ value: borrowing JavaScriptValue, as type: T.Type) throws -> T {
  guard value.pointee.isBigInt() else {
    throw JavaScriptValue.TypeError(type: Double.self)
  }
  guard let jsiRuntime = value.jsiRuntime else {
    FatalError.runtimeLost()
  }
  if let result = bigIntExactly(value.pointee, in: jsiRuntime, as: T.self) {
    return result
  }
  throw BigIntOutOfRangeException(value: (try? value.getBigInt().toString()) ?? "<bigint>", type: "\(T.self)")
}

/// `JavaScriptUnownedValue` counterpart of `genericDecodeWideNonNumber`.
@JavaScriptActor
func genericDecodeWideNonNumber<T: FixedWidthInteger>(
  _ value: borrowing JavaScriptUnownedValue,
  as type: T.Type,
  runtime: borrowing JavaScriptRuntime
) throws -> T {
  guard value.pointer.pointee.isBigInt() else {
    throw JavaScriptValue.TypeError(type: Double.self)
  }
  if let result = bigIntExactly(value.pointer.pointee, in: value.runtime, as: T.self) {
    return result
  }
  throw BigIntOutOfRangeException(
    value: (try? value.getBigInt(in: runtime).toString()) ?? "<bigint>",
    type: "\(T.self)"
  )
}

/// Encodes a 64-bit-wide integer to a JS `number`, throwing when it falls outside JavaScript's
/// safe-integer range where a `Double` could no longer represent it exactly. Used by `Int`/`UInt`,
/// whose JS mapping stays a `number`; the explicitly-sized 64-bit types encode as a `bigint` instead.
@inlinable
@JavaScriptActor
func genericEncodeSafeInteger<T: FixedWidthInteger>(_ value: T) throws -> JavaScriptValue {
  return .number(try genericSafeIntegerNumber(value))
}

/// Converts a 64-bit-wide integer to the `Double` of a JS `number`, throwing like `genericEncodeSafeInteger`.
@inlinable
@JavaScriptActor
func genericSafeIntegerNumber<T: FixedWidthInteger>(_ value: T) throws -> Double {
  // `Number.MAX_SAFE_INTEGER` (2^53 - 1): the largest magnitude where every integer up to it, and the
  // next one, is representable as a JS number. 2^53 itself is representable but unsafe (it collides with
  // 2^53 + 1), so the bound is exclusive above this. Used by `Int`/`UInt`, both 64-bit, so 2^53 fits.
  let maxSafeInteger: T.Magnitude = (1 << 53) - 1
  guard value.magnitude <= maxSafeInteger else {
    throw UnsafeIntegerException(value: "\(value)")
  }
  return Double(value)
}

/// Thrown when a JavaScript number cannot be represented as the target integer type because it is
/// non-finite or outside the type's range.
public struct IntegerOutOfRangeException: JavaScriptThrowable {
  @usableFromInline
  let value: Double
  @usableFromInline
  let type: String

  @usableFromInline
  init(value: Double, type: String) {
    self.value = value
    self.type = type
  }

  public var code: String {
    "ERR_INTEGER_OUT_OF_RANGE"
  }
  public var message: String {
    "JavaScript number '\(value)' cannot be represented as \(type)"
  }
}

/// Thrown when a JavaScript BigInt is outside the target integer type's range. The value is kept as a
/// string because an out-of-range BigInt is, by definition, not representable as a 64-bit integer.
public struct BigIntOutOfRangeException: JavaScriptThrowable {
  @usableFromInline
  let value: String
  @usableFromInline
  let type: String

  @usableFromInline
  init(value: String, type: String) {
    self.value = value
    self.type = type
  }

  public var code: String {
    "ERR_BIGINT_OUT_OF_RANGE"
  }
  public var message: String {
    "JavaScript BigInt '\(value)' cannot be represented as \(type)"
  }
}

/// Thrown when an `Int`/`UInt` is encoded to a JS number but its magnitude exceeds JavaScript's
/// safe-integer range (`Number.MAX_SAFE_INTEGER`, 2^53 - 1), where a JS number can no longer represent
/// it exactly. Use `Int64`/`UInt64` to carry such values as a JS `bigint` without loss.
public struct UnsafeIntegerException: JavaScriptThrowable {
  @usableFromInline
  let value: String

  @usableFromInline
  init(value: String) {
    self.value = value
  }

  public var code: String {
    "ERR_UNSAFE_INTEGER"
  }
  public var message: String {
    "Integer '\(value)' exceeds the range JavaScript can represent exactly; use Int64 or UInt64 to encode it as a BigInt"
  }
}

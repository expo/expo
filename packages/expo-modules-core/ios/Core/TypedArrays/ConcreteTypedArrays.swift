// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

// Each concrete typed array overrides `decode` to return its own `Self` and reject a mismatched kind,
// delegating to the shared `decode(_:expectingKind:)` on the base. See `TypedArray.swift` for why the
// witness is an overridable `class func` rather than living in the conformance extension.

/// Native equivalent of `Int8Array` in JavaScript, an array of two's-complement 8-bit signed integers.
public final class Int8Array: GenericTypedArray<Int8> {
  @JavaScriptActor
  @inlinable
  public override class func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Int8Array
  {
    return try decode(value, expectingKind: .Int8Array)
  }
}

/// Native equivalent of `Int16Array` in JavaScript, an array of two's-complement 16-bit signed integers.
public final class Int16Array: GenericTypedArray<Int16> {
  @JavaScriptActor
  @inlinable
  public override class func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Int16Array
  {
    return try decode(value, expectingKind: .Int16Array)
  }
}

/// Native equivalent of `Int32Array` in JavaScript, an array of two's-complement 32-bit signed integers.
public final class Int32Array: GenericTypedArray<Int32> {
  @JavaScriptActor
  @inlinable
  public override class func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Int32Array
  {
    return try decode(value, expectingKind: .Int32Array)
  }
}

/// Native equivalent of `Uint8Array` in JavaScript, an array of 8-bit unsigned integers.
public final class Uint8Array: GenericTypedArray<UInt8> {
  @JavaScriptActor
  @inlinable
  public override class func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Uint8Array
  {
    return try decode(value, expectingKind: .Uint8Array)
  }
}

/// Native equivalent of `Uint8ClampedArray` in JavaScript, an array of 8-bit unsigned integers clamped to 0-255.
public final class Uint8ClampedArray: GenericTypedArray<UInt8> {
  @JavaScriptActor
  @inlinable
  public override class func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Uint8ClampedArray
  {
    return try decode(value, expectingKind: .Uint8ClampedArray)
  }
}

/// Native equivalent of `Uint16Array` in JavaScript, an array of 16-bit unsigned integers.
public final class Uint16Array: GenericTypedArray<UInt16> {
  @JavaScriptActor
  @inlinable
  public override class func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Uint16Array
  {
    return try decode(value, expectingKind: .Uint16Array)
  }
}

/// Native equivalent of `Uint32Array` in JavaScript, an array of 32-bit unsigned integers.
public final class Uint32Array: GenericTypedArray<UInt32> {
  @JavaScriptActor
  @inlinable
  public override class func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Uint32Array
  {
    return try decode(value, expectingKind: .Uint32Array)
  }
}

/// Native equivalent of `Float32Array` in JavaScript, an array of 32-bit floating point numbers.
public final class Float32Array: GenericTypedArray<Float32> {
  @JavaScriptActor
  @inlinable
  public override class func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Float32Array
  {
    return try decode(value, expectingKind: .Float32Array)
  }
}

/// Native equivalent of `Float64Array` in JavaScript, an array of 64-bit floating point numbers.
public final class Float64Array: GenericTypedArray<Float64> {
  @JavaScriptActor
  @inlinable
  public override class func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Float64Array
  {
    return try decode(value, expectingKind: .Float64Array)
  }
}

/// Native equivalent of `BigInt64Array` in JavaScript, an array of 64-bit signed integers.
public final class BigInt64Array: GenericTypedArray<Int64> {
  @JavaScriptActor
  @inlinable
  public override class func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> BigInt64Array
  {
    return try decode(value, expectingKind: .BigInt64Array)
  }
}

/// Native equivalent of `BigUint64Array` in JavaScript, an array of 64-bit unsigned integers.
public final class BigUint64Array: GenericTypedArray<UInt64> {
  @JavaScriptActor
  @inlinable
  public override class func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> BigUint64Array
  {
    return try decode(value, expectingKind: .BigUint64Array)
  }
}

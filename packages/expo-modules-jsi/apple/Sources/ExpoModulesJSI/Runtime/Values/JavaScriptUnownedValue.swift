// Copyright 2025-present 650 Industries. All rights reserved.

internal import ExpoModulesJSI_Cxx
import Foundation
internal import jsi

/// A non-owning, non-copyable `JavaScriptValue` that borrows a `facebook.jsi.Value` owned elsewhere —
/// typically an argument still living in the `JavaScriptValuesBuffer` for the duration of a host
/// function call.
///
/// Unlike ``JavaScriptValue`` (a `final class` that owns its `jsi::Value`) and ``JavaScriptRef``
/// (an owning reference that promotes a value to reference semantics so it *can* escape), an unowned
/// value owns nothing: it borrows a `jsi::Value` whose lifetime is guaranteed by someone else. It
/// exists to feed the argument-decode fast path, where wrapping each argument in a heap-allocated
/// owning `JavaScriptValue` (ARC plus a real `jsi::Value` copy, per argument, per call) is pure
/// overhead — `decode` only needs to *read* the argument long enough to extract a `Double`/`String`/etc.
///
/// > Warning: Lifetime safety rests on convention, not the compiler. `~Copyable` prevents *aliasing*
/// > the value but does not enforce that the owning buffer outlives it. Unlike Swift's `unowned(safe)`
/// > class refs, there is no trap on use-after-free. The contract is "valid only within the synchronous
/// > decode call, while the owner is alive" — which the buffer-driven decode path honors because it
/// > reads the value inline on the JS thread before the buffer is torn down. Do not store, capture, or
/// > escape it; call ``copied(in:)`` to materialize an owning value when escape is needed.
// `@frozen` so client modules, which decode every `@JS` argument through an unowned value, know its
// size and that it is trivial to destroy, instead of asking the type's metadata accessor for both.
@frozen
public struct JavaScriptUnownedValue: ~Copyable {
  // MARK: - Layout

  // Every stored property below is part of the frozen layout: adding, removing or reordering one
  // changes the ABI that client modules compiled against, and each type has to be public, which is
  // why both are kept as raw pointers and rebuilt into their C++ views on access.

  // The address of the borrowed `jsi::Value`. The value is not owned and must not outlive its owner.
  internal let rawPointer: UnsafeRawPointer

  // The JSI runtime, stored as the raw `facebook.jsi.IRuntime` rather than the `JavaScriptRuntime`
  // wrapper. `IRuntime` is imported as an immortal reference (see `jsi.apinotes`), so storing and
  // rebuilding it emits no ARC, unlike a `JavaScriptRuntime` field whose every per-call access pays an
  // unowned retain/release. Only the string, object and array accessors read it; the type checks and
  // numeric accessors touch only `pointer`.
  internal let rawRuntime: UnsafeRawPointer

  // MARK: - C++ views

  internal var pointer: UnsafePointer<facebook.jsi.Value> {
    return rawPointer.assumingMemoryBound(to: facebook.jsi.Value.self)
  }

  // `unsafeBitCast` rather than `Unmanaged.takeUnretainedValue()`: with an immortal reference, the
  // latter crashes the SIL optimizer (Swift 6.4) in Release builds.
  internal var runtime: facebook.jsi.IRuntime {
    return unsafeBitCast(rawRuntime, to: facebook.jsi.IRuntime.self)
  }

  internal init(_ runtime: facebook.jsi.IRuntime, _ pointer: UnsafePointer<facebook.jsi.Value>) {
    self.rawRuntime = unsafeBitCast(runtime, to: UnsafeRawPointer.self)
    self.rawPointer = UnsafeRawPointer(pointer)
  }

  /// Materializes an owning ``JavaScriptValue`` by copying the borrowed `jsi::Value`. Use it when the
  /// value must outlive the decode call (stored, captured, handed to a `Promise`). Takes the
  /// `JavaScriptRuntime` wrapper since the owning value needs it; the caller has it in scope.
  ///
  /// `runtime` must be the runtime that owns the borrowed value. Copying a reference value (string,
  /// object, function, array, bigint) clones its `PointerValue` against `runtime`, so passing a
  /// different runtime would clone a handle from another heap and corrupt it; the assert guards that.
  public func copied(in runtime: JavaScriptRuntime) -> JavaScriptValue {
    assert(
      isOwned(by: runtime),
      "`copied(in:)` must be passed the runtime that owns the borrowed value"
    )
    return JavaScriptValue(runtime, copying: pointer.pointee)
  }

  // MARK: - Type checks

  public func isUndefined() -> Bool {
    return pointer.pointee.isUndefined()
  }

  public func isNull() -> Bool {
    return pointer.pointee.isNull()
  }

  public func isBool() -> Bool {
    return pointer.pointee.isBool()
  }

  public func isNumber() -> Bool {
    return pointer.pointee.isNumber()
  }

  public func isString() -> Bool {
    return pointer.pointee.isString()
  }

  public func isSymbol() -> Bool {
    return pointer.pointee.isSymbol()
  }

  public func isBigInt() -> Bool {
    return pointer.pointee.isBigInt()
  }

  public func isObject() -> Bool {
    return pointer.pointee.isObject()
  }

  // MARK: - Primitive accessors

  /// Returns the value as a boolean, or asserts if not a boolean.
  public func getBool() -> Bool {
    assert(isBool(), "Value is not a boolean")
    return pointer.pointee.getBool()
  }

  /// Returns the value as an integer, or asserts if not a number.
  public func getInt() -> Int {
    assert(isNumber(), "Value is not a number")
    return Int(pointer.pointee.getNumber())
  }

  /// Returns the value as a double, or asserts if not a number.
  public func getDouble() -> Double {
    assert(isNumber(), "Value is not a number")
    return pointer.pointee.getNumber()
  }

  /// Returns the value as a string, or asserts if not a string.
  public func getString() -> String {
    assert(isString(), "Value is not a string")
    return String(jsiStringValue: pointer.pointee, in: runtime)
  }

  /// Returns the value as a ``JavaScriptObject`` *without* materializing an owning ``JavaScriptValue``
  /// first, or asserts if not an object. Mirrors ``JavaScriptValue/getObject()``: `jsi::Value::getObject`
  /// borrows the value and hands back a `jsi::Object` (a ref-count bump on the object pointer), so this
  /// skips the per-call owning-value allocation and `PointerValue` clone that ``copied(in:)`` pays.
  ///
  /// The returned object owns its `jsi::Object` and so may outlive this borrowed value; only the
  /// borrowed `jsi::Value` must not. Takes the ``JavaScriptRuntime`` wrapper because the object needs
  /// it (the unowned value stores only the raw `IRuntime` to avoid per-call ARC); `runtime` must be
  /// the runtime that owns the borrowed value, same contract as ``copied(in:)``.
  public func getObject(in runtime: JavaScriptRuntime) -> JavaScriptObject {
    assert(isObject(), "Value is not an object")
    assert(
      isOwned(by: runtime),
      "`getObject(in:)` must be passed the runtime that owns the borrowed value"
    )
    return JavaScriptObject(runtime, pointer.pointee.getObject(self.runtime))
  }

  /// Whether the value is an array. The zero-copy counterpart of ``JavaScriptValue/isArray()``.
  public func isArray() -> Bool {
    return pointer.pointee.isObject() && pointer.pointee.getObject(runtime).isArray(runtime)
  }

  /// Returns the value as a ``JavaScriptArray``, or asserts if it is not an array. The zero-copy
  /// counterpart of ``JavaScriptValue/getArray()``, with the same runtime contract as
  /// ``getObject(in:)``.
  public func getArray(in runtime: JavaScriptRuntime) -> JavaScriptArray {
    assert(isArray(), "Value is not an array")
    assert(
      isOwned(by: runtime),
      "`getArray(in:)` must be passed the runtime that owns the borrowed value"
    )
    return JavaScriptArray(runtime, pointer.pointee.getObject(self.runtime).getArray(self.runtime))
  }

  /// Whether the value is a function. The zero-copy counterpart of ``JavaScriptValue/isFunction()``.
  public func isFunction() -> Bool {
    return pointer.pointee.isObject() && pointer.pointee.getObject(runtime).isFunction(runtime)
  }

  /// Whether the value is a typed array. The zero-copy counterpart of ``JavaScriptValue/isTypedArray()``.
  public func isTypedArray() -> Bool {
    return pointer.pointee.isObject() && expo.isTypedArray(runtime, pointer.pointee.getObject(runtime))
  }

  /// Whether the value is an `ArrayBuffer`. The zero-copy counterpart of ``JavaScriptValue/isArrayBuffer()``.
  public func isArrayBuffer() -> Bool {
    return pointer.pointee.isObject() && pointer.pointee.getObject(runtime).isArrayBuffer(runtime)
  }

  /// Returns the value as a ``JavaScriptTypedArray``, or asserts if it is not a typed array. The
  /// zero-copy counterpart of ``JavaScriptValue/getTypedArray()``, with the same runtime contract as
  /// ``getObject(in:)``.
  @JavaScriptActor
  public func getTypedArray(in runtime: JavaScriptRuntime) -> JavaScriptTypedArray {
    assert(isTypedArray(), "Value is not a typed array")
    assert(isOwned(by: runtime), "`getTypedArray(in:)` must be passed the runtime that owns the borrowed value")
    return JavaScriptTypedArray(runtime, pointer.pointee.getObject(self.runtime))
  }

  /// Returns the value as a ``JavaScriptArrayBuffer``, or asserts if it is not an `ArrayBuffer`. The
  /// zero-copy counterpart of ``JavaScriptValue/getArrayBuffer()``, with the same runtime contract as
  /// ``getObject(in:)``.
  public func getArrayBuffer(in runtime: JavaScriptRuntime) -> JavaScriptArrayBuffer {
    assert(isArrayBuffer(), "Value is not an array buffer")
    assert(isOwned(by: runtime), "`getArrayBuffer(in:)` must be passed the runtime that owns the borrowed value")
    return JavaScriptArrayBuffer(runtime, expo.arrayBufferFromValue(self.runtime, pointer.pointee))
  }

  /// Returns the value as a ``JavaScriptBigInt``, or asserts if it is not a BigInt. The zero-copy
  /// counterpart of ``JavaScriptValue/getBigInt()``, with the same runtime contract as ``getObject(in:)``.
  public func getBigInt(in runtime: JavaScriptRuntime) -> JavaScriptBigInt {
    assert(isBigInt(), "Value is not a BigInt")
    assert(isOwned(by: runtime), "`getBigInt(in:)` must be passed the runtime that owns the borrowed value")
    return JavaScriptBigInt(runtime, pointer.pointee.getBigInt(self.runtime))
  }

  /// The kind of the value. The zero-copy counterpart of ``JavaScriptValue/kind``.
  public var kind: JavaScriptValue.Kind {
    switch true {
    case isUndefined():
      return .undefined
    case isNull():
      return .null
    case isBool():
      return .bool
    case isNumber():
      return .number
    case isBigInt():
      return .bigint
    case isSymbol():
      return .symbol
    case isString():
      return .string
    case isFunction():
      return .function
    default:
      return .object
    }
  }

  /// Whether `runtime` is the runtime that owns the borrowed value.
  private func isOwned(by runtime: JavaScriptRuntime) -> Bool {
    return unsafeBitCast(runtime.pointee, to: UnsafeRawPointer.self) == rawRuntime
  }

  // MARK: - Throwing conversions ("as functions")

  /// Returns the value as a boolean, or throws `TypeError` if it is not a boolean.
  public func asBool() throws(JavaScriptValue.TypeError) -> Bool {
    guard isBool() else {
      throw JavaScriptValue.TypeError(type: Bool.self)
    }
    return getBool()
  }

  /// Returns the value as an integer, or throws `TypeError` if it is not a number.
  public func asInt() throws(JavaScriptValue.TypeError) -> Int {
    guard isNumber() else {
      throw JavaScriptValue.TypeError(type: Int.self)
    }
    return getInt()
  }

  /// Returns the value as a double, or throws `TypeError` if it is not a number.
  public func asDouble() throws(JavaScriptValue.TypeError) -> Double {
    guard isNumber() else {
      throw JavaScriptValue.TypeError(type: Double.self)
    }
    return getDouble()
  }

  /// Returns the value as a string, or throws `TypeError` if it is not a string.
  public func asString() throws(JavaScriptValue.TypeError) -> String {
    guard isString() else {
      throw JavaScriptValue.TypeError(type: String.self)
    }
    return getString()
  }

  /// Returns the value as a ``JavaScriptObject``, or throws `TypeError` if it is not an object. The
  /// zero-copy counterpart of ``JavaScriptValue/asObject()``; see ``getObject(in:)``.
  public func asObject(in runtime: JavaScriptRuntime) throws(JavaScriptValue.TypeError) -> JavaScriptObject {
    guard isObject() else {
      throw JavaScriptValue.TypeError(type: JavaScriptObject.self)
    }
    return getObject(in: runtime)
  }

  /// Returns the value as a ``JavaScriptArray``, or throws `TypeError` if it is not an array. The
  /// zero-copy counterpart of ``JavaScriptValue/asArray()``; see ``getArray(in:)``.
  public func asArray(in runtime: JavaScriptRuntime) throws(JavaScriptValue.TypeError) -> JavaScriptArray {
    guard isArray() else {
      throw JavaScriptValue.TypeError(type: JavaScriptArray.self)
    }
    return getArray(in: runtime)
  }
}

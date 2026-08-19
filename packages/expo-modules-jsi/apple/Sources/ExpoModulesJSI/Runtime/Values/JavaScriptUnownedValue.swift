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
public struct JavaScriptUnownedValue: ~Copyable {
  // Borrows the `jsi::Value` at this address; it does not own it and must not outlive the owner.
  internal let pointer: UnsafePointer<facebook.jsi.Value>

  // The JSI runtime, stored as the raw `facebook.jsi.IRuntime` rather than the `JavaScriptRuntime`
  // wrapper. `IRuntime` is imported as an immortal reference (see `jsi.apinotes`), so storing and
  // copying it emits no ARC, unlike a `JavaScriptRuntime` field whose every per-call access pays an
  // unowned retain/release. Only `getString` reads it; the type checks and numeric accessors touch
  // only `pointer`.
  internal let runtime: facebook.jsi.IRuntime

  internal init(_ runtime: facebook.jsi.IRuntime, _ pointer: UnsafePointer<facebook.jsi.Value>) {
    self.runtime = runtime
    self.pointer = pointer
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
      Unmanaged.passUnretained(runtime.pointee).toOpaque() == Unmanaged.passUnretained(self.runtime).toOpaque(),
      "`copied(in:)` must be passed the runtime that owns the borrowed value")
    return JavaScriptValue(runtime, pointer.pointee)
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
    return String(pointer.pointee.getString(runtime).utf8(runtime))
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
      Unmanaged.passUnretained(runtime.pointee).toOpaque() == Unmanaged.passUnretained(self.runtime).toOpaque(),
      "`getObject(in:)` must be passed the runtime that owns the borrowed value")
    return JavaScriptObject(runtime, pointer.pointee.getObject(self.runtime))
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
}

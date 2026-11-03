// Copyright 2026-present 650 Industries. All rights reserved.

internal import ExpoModulesJSI_Cxx
internal import jsi

extension JavaScriptValue {
  /// Creates the value that `encode` writes into a slot, for an API that takes a `JavaScriptValue`, such as
  /// an event payload. `encode` must write exactly one value unless it throws (see ``Slot``).
  @JavaScriptActor
  public static func encoding(
    in runtime: borrowing JavaScriptRuntime,
    _ encode: (borrowing Slot) throws -> Void
  ) rethrows -> JavaScriptValue {
    let pointer = UnsafeMutablePointer<facebook.jsi.Value>.allocate(capacity: 1)
    defer {
      pointer.deallocate()
    }
    // The slot holds `undefined`, which owns nothing, until the encode writes over it, so it stays valid
    // when the encode throws.
    expo.emplaceUndefined(pointer)
    try encode(Slot(pointer))
    return JavaScriptValue(runtime, pointer.move())
  }

  /// Memory for one engine value that a `JavaScriptEncodable` type encodes into with
  /// ``JavaScriptEncodable/encode(_:into:in:)``, for example an argument of a JavaScript function call or an
  /// element of a new array.
  ///
  /// The slot holds no value at first. An encode that returns normally writes exactly one value into it,
  /// and one that throws writes nothing: the slot's owner releases only the values that were written, so a
  /// second write leaks the first value, and a write followed by a throw leaks the written one.
  ///
  /// The slot is memory for the engine's value itself, not for a `JavaScriptValue` that wraps it. It is lent
  /// to the encode as a `borrowing` parameter, and as a non-copyable type it can't be copied or stored, so it
  /// can't outlive the call.
  // `@frozen` so client modules pass it as a plain pointer, like `JavaScriptValuesBuffer`.
  @frozen
  public struct Slot: ~Copyable {
    // Type-erased because a stored property of a frozen struct is part of its ABI, so its type must be
    // public, and `facebook.jsi.Value` is not.
    internal nonisolated(unsafe) let start: UnsafeMutableRawPointer

    internal init(_ pointer: UnsafeMutablePointer<facebook.jsi.Value>) {
      self.start = UnsafeMutableRawPointer(pointer)
    }

    internal var pointer: UnsafeMutablePointer<facebook.jsi.Value> {
      return start.assumingMemoryBound(to: facebook.jsi.Value.self)
    }

    /// Moves `value` into the slot, without a clone.
    public func emplace(_ value: consuming JavaScriptValue) {
      JavaScriptValue.write(value, to: pointer)
    }

    /// Moves the value that `encode` returns into the slot. The default ``JavaScriptEncodable/encode(_:into:in:)``
    /// goes through this, so the value is returned into storage in this module, where `JavaScriptValue` has a
    /// known layout. A caller in another module handles a `JavaScriptValue` through its type metadata.
    @usableFromInline
    internal func emplace(encoding encode: () throws -> JavaScriptValue) rethrows {
      // A local `var` takes the returned value in place. Passing the call result straight to a `consuming`
      // parameter moves it once more, and each move of a `jsi::Value` calls into the engine.
      var value = try encode()
      expo.emplaceValue(pointer, &value.pointee)
    }

    /// Moves the object into the slot, without a clone.
    public func emplace(_ object: consuming JavaScriptObject) {
      expo.emplaceMovedObject(pointer, &object.pointee)
    }

    /// Moves the array into the slot, without a clone.
    public func emplace(_ array: consuming JavaScriptArray) {
      expo.emplaceMovedArray(pointer, &array.pointee)
    }

    /// Writes `undefined` into the slot.
    public func emplaceUndefined() {
      expo.emplaceUndefined(pointer)
    }

    /// Writes `null` into the slot.
    public func emplaceNull() {
      expo.emplaceNull(pointer)
    }

    /// Writes a boolean into the slot.
    public func emplace(bool: Bool) {
      expo.emplaceBool(pointer, bool)
    }

    /// Writes a number into the slot.
    public func emplace(number: Double) {
      expo.emplaceNumber(pointer, number)
    }

    /// Creates a JavaScript string from `string` straight in the slot.
    public func emplace(string: String, in runtime: borrowing JavaScriptRuntime) {
      let iRuntime = runtime.pointee
      let slot = pointer
      string.withJSIUTF8 { utf8, count in
        expo.emplaceStringFromUtf8(slot, iRuntime, utf8, count)
      }
    }
  }
}

// Copyright 2025-present 650 Industries. All rights reserved.

internal import jsi
internal import ExpoModulesJSI_Cxx

public struct JavaScriptTypedArray: ~Copyable {
  internal weak let runtime: JavaScriptRuntime?
  internal let pointee: facebook.jsi.Object

  /**
   The underlying `ArrayBuffer` backing this typed array. Stored alongside `pointee`
   so that holding the Swift value keeps the backing store alive on the JS side —
   the JS garbage collector cannot free the buffer while this reference exists.
   */
  internal let arrayBuffer: facebook.jsi.ArrayBuffer

  public let kind: Kind

  init(_ runtime: JavaScriptRuntime, _ object: consuming facebook.jsi.Object) {
    self.runtime = runtime
    self.kind = Kind(rawValue: Int(expo.getTypedArrayKind(runtime.pointee, object).rawValue))!
    self.byteLength = Int(object.getProperty(runtime.pointee, "byteLength").getNumber())
    self.byteOffset = Int(object.getProperty(runtime.pointee, "byteOffset").getNumber())
    self.length = Int(object.getProperty(runtime.pointee, "length").getNumber())
    self.arrayBuffer = expo.getTypedArrayBuffer(runtime.pointee, object)
    self.pointee = object
  }

  /**
   Invokes the closure with a raw buffer pointer covering the typed array's bytes.
   The pointer is valid only for the duration of the closure and must not escape it.
   */
  public func withUnsafeBytes<R>(_ body: (UnsafeRawBufferPointer) throws -> R) rethrows -> R {
    return try body(UnsafeRawBufferPointer(start: startPointer(), count: byteLength))
  }

  /**
   Invokes the closure with a mutable raw buffer pointer covering the typed array's bytes.
   Writes through the buffer are visible to JavaScript. The pointer is valid only for the duration of the closure.
   */
  public func withUnsafeMutableBytes<R>(_ body: (UnsafeMutableRawBufferPointer) throws -> R) rethrows -> R {
    return try body(UnsafeMutableRawBufferPointer(start: startPointer(), count: byteLength))
  }

  /**
   Invokes the closure with a typed buffer pointer over the elements of the typed array.
   The generic type must match the array's element type (e.g. `UInt8` for `Uint8Array`, `Int32` for `Int32Array`);
   passing a mismatched type reinterprets the bytes and is a programmer error.
   */
  public func withUnsafeBufferPointer<T, R>(as type: T.Type, _ body: (UnsafeBufferPointer<T>) throws -> R) rethrows -> R {
    return try withUnsafeBytes { bytes in
      try body(bytes.bindMemory(to: T.self))
    }
  }

  /**
   Invokes the closure with a mutable typed buffer pointer over the elements of the typed array.
   The generic type must match the array's element type. Writes through the buffer are visible to JavaScript.
   */
  public func withUnsafeMutableBufferPointer<T, R>(as type: T.Type, _ body: (UnsafeMutableBufferPointer<T>) throws -> R) rethrows -> R {
    return try withUnsafeMutableBytes { bytes in
      try body(bytes.bindMemory(to: T.self))
    }
  }

  /**
   Returns a pointer to the first byte of the typed array's data — the beginning of the underlying
   ArrayBuffer, advanced by `byteOffset`. The pointer is tied to the ArrayBuffer retained by this
   value; it is only valid while this `JavaScriptTypedArray` is alive.
   */
  private func startPointer() -> UnsafeMutablePointer<UInt8> {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return expo.arrayBufferData(runtime.pointee, arrayBuffer).advanced(by: byteOffset)
  }

  // We need to redefine the C++ enum (see TypedArray.h) to expose it to Swift
  // without leaking the C++ type into the public API. Please keep them in-sync!
  public enum Kind: Int {
    case Int8Array = 1
    case Int16Array = 2
    case Int32Array = 3
    case Uint8Array = 4
    case Uint8ClampedArray = 5
    case Uint16Array = 6
    case Uint32Array = 7
    case Float32Array = 8
    case Float64Array = 9
    case BigInt64Array = 10
    case BigUint64Array = 11
  }

  // MARK: - Expose JS properties

  /**
   The length in bytes from the start of the underlying ArrayBuffer.
   Fixed at construction time and thus read-only.
   */
  public let byteLength: Int

  /**
   The offset in bytes from the start of the underlying ArrayBuffer.
   Fixed at construction time and thus read-only.
   */
  public let byteOffset: Int

  /**
   Returns the number of elements held in the typed array.
   Fixed at construction time and thus read only.
   */
  public let length: Int

  // MARK: - Conversions

  /**
   Returns the underlying `ArrayBuffer` that this typed array is a view of.
   Equivalent to the JavaScript `.buffer` property.
   */
  public func getArrayBuffer() -> JavaScriptArrayBuffer {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let buffer = pointee.getPropertyAsObject(runtime.pointee, "buffer").getArrayBuffer(runtime.pointee)
    return JavaScriptArrayBuffer(runtime, buffer)
  }

  /**
   Returns the typed array as a `JavaScriptValue`.
   */
  public func asValue() -> JavaScriptValue {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtime, facebook.jsi.Value(runtime.pointee, pointee))
  }

  // MARK: - Providing JavaScriptObject API

  public func getProperty(_ name: String) -> JavaScriptValue {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtime, pointee.getProperty(runtime.pointee, name))
  }
}

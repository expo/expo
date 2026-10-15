// Copyright 2025-present 650 Industries. All rights reserved.

// swift-format-ignore-file: AlwaysUseLowerCamelCase
// `Kind` enum cases mirror the JavaScript TypedArray constructor names verbatim
// (`Int8Array`, `Uint8ClampedArray`, etc.) and must not be lowercased.

internal import ExpoModulesJSI_Cxx
internal import jsi

public struct JavaScriptTypedArray: ~Copyable {
  /// Handle to the runtime the typed array belongs to.
  internal let runtimeHandle: JavaScriptRuntimeHandle
  internal let pointee: facebook.jsi.Object

  /// The underlying `ArrayBuffer` backing this typed array. Stored alongside `pointee`
  /// so that holding the Swift value keeps the backing store alive on the JS side —
  /// the JS garbage collector cannot free the buffer while this reference exists.
  internal let arrayBuffer: facebook.jsi.ArrayBuffer

  public let kind: Kind

  /// The runtime the typed array belongs to, or `nil` if it has been deallocated. Prefer
  /// ``jsiRuntime`` on hot paths: it costs no reference counting.
  internal var runtime: JavaScriptRuntime? {
    return runtimeHandle.runtime
  }

  /// The engine runtime the typed array belongs to, or `nil` if the runtime has been deallocated.
  internal var jsiRuntime: facebook.jsi.IRuntime? {
    return runtimeHandle.pointee
  }

  /// Creates a typed array from an existing JSI object, which belongs to `runtime`.
  @JavaScriptActor
  init(_ runtime: borrowing JavaScriptRuntime, _ object: consuming facebook.jsi.Object) {
    let jsiRuntime = runtime.pointee
    let propNames = runtime.cached(PropNames.key) { PropNames(jsiRuntime) }
    self.runtimeHandle = runtime.handle
    self.kind = Kind(
      rawValue: Int(expo.getTypedArrayKind(jsiRuntime, object, propNames.constructor, propNames.name).rawValue)
    )!
    self.byteLength = Int(object.getProperty(jsiRuntime, propNames.byteLength).getNumber())
    self.byteOffset = Int(object.getProperty(jsiRuntime, propNames.byteOffset).getNumber())
    self.length = Int(object.getProperty(jsiRuntime, propNames.length).getNumber())
    self.arrayBuffer = expo.getTypedArrayBuffer(jsiRuntime, object, propNames.buffer)
    self.pointee = object
  }

  /// The property names the initializer reads. Creating a property name costs about as much as
  /// reading the property, so they are created once per runtime and kept in its cache.
  internal final class PropNames {
    static let key = JavaScriptRuntime.Cache.Key<PropNames>()

    let constructor: facebook.jsi.PropNameID
    let name: facebook.jsi.PropNameID
    let byteLength: facebook.jsi.PropNameID
    let byteOffset: facebook.jsi.PropNameID
    let length: facebook.jsi.PropNameID
    let buffer: facebook.jsi.PropNameID

    init(_ jsiRuntime: facebook.jsi.IRuntime) {
      constructor = "constructor".toJSIPropNameID(in: jsiRuntime)
      name = "name".toJSIPropNameID(in: jsiRuntime)
      byteLength = "byteLength".toJSIPropNameID(in: jsiRuntime)
      byteOffset = "byteOffset".toJSIPropNameID(in: jsiRuntime)
      length = "length".toJSIPropNameID(in: jsiRuntime)
      buffer = "buffer".toJSIPropNameID(in: jsiRuntime)
    }
  }

  /// Invokes the closure with a raw buffer pointer covering the typed array's bytes.
  /// The pointer is valid only for the duration of the closure and must not escape it.
  public func withUnsafeBytes<R>(_ body: (UnsafeRawBufferPointer) throws -> R) rethrows -> R {
    return try body(UnsafeRawBufferPointer(start: startPointer(), count: byteLength))
  }

  /// Invokes the closure with a mutable raw buffer pointer covering the typed array's bytes.
  /// Writes through the buffer are visible to JavaScript. The pointer is valid only for the duration of the closure.
  public func withUnsafeMutableBytes<R>(_ body: (UnsafeMutableRawBufferPointer) throws -> R) rethrows -> R {
    return try body(UnsafeMutableRawBufferPointer(start: startPointer(), count: byteLength))
  }

  /// Invokes the closure with a typed buffer pointer over the elements of the typed array.
  /// The generic type must match the array's element type (e.g. `UInt8` for `Uint8Array`, `Int32` for `Int32Array`);
  /// passing a mismatched type reinterprets the bytes and is a programmer error.
  public func withUnsafeBufferPointer<T, R>(as type: T.Type, _ body: (UnsafeBufferPointer<T>) throws -> R) rethrows -> R
  {
    return try withUnsafeBytes { bytes in
      try body(bytes.bindMemory(to: T.self))
    }
  }

  /// Invokes the closure with a mutable typed buffer pointer over the elements of the typed array.
  /// The generic type must match the array's element type. Writes through the buffer are visible to JavaScript.
  public func withUnsafeMutableBufferPointer<T, R>(as type: T.Type, _ body: (UnsafeMutableBufferPointer<T>) throws -> R)
    rethrows -> R
  {
    return try withUnsafeMutableBytes { bytes in
      try body(bytes.bindMemory(to: T.self))
    }
  }

  /// Returns a pointer to the first byte of the typed array's data — the beginning of the underlying
  /// ArrayBuffer, advanced by `byteOffset`. The pointer is tied to the ArrayBuffer retained by this
  /// value; it is only valid while this `JavaScriptTypedArray` is alive.
  private func startPointer() -> UnsafeMutablePointer<UInt8> {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return expo.arrayBufferData(jsiRuntime, arrayBuffer).advanced(by: byteOffset)
  }

  // We need to redefine the C++ enum (see TypedArray.h) to expose it to Swift
  // without leaking the C++ type into the public API. Please keep them in-sync!
  public enum Kind: Int, Sendable {
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

  /// The length in bytes from the start of the underlying ArrayBuffer.
  /// Fixed at construction time and thus read-only.
  public let byteLength: Int

  /// The offset in bytes from the start of the underlying ArrayBuffer.
  /// Fixed at construction time and thus read-only.
  public let byteOffset: Int

  /// Returns the number of elements held in the typed array.
  /// Fixed at construction time and thus read only.
  public let length: Int

  // MARK: - Conversions

  /// Returns the underlying `ArrayBuffer` that this typed array is a view of.
  /// Equivalent to the JavaScript `.buffer` property.
  public func getArrayBuffer() -> JavaScriptArrayBuffer {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    let buffer = pointee.getPropertyAsObject(jsiRuntime, "buffer").getArrayBuffer(jsiRuntime)
    return JavaScriptArrayBuffer(runtimeHandle, buffer)
  }

  /// Returns the typed array as a `JavaScriptValue`.
  public func asValue() -> JavaScriptValue {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtimeHandle, facebook.jsi.Value(jsiRuntime, pointee))
  }

  // MARK: - Providing JavaScriptObject API

  public func getProperty(_ name: String) -> JavaScriptValue {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtimeHandle, pointee.getProperty(jsiRuntime, name))
  }
}

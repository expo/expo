// Copyright 2025-present 650 Industries. All rights reserved.

// swift-format-ignore-file: AlwaysUseLowerCamelCase
// `Kind` enum cases mirror the JavaScript TypedArray constructor names verbatim
// (`Int8Array`, `Uint8ClampedArray`, etc.) and must not be lowercased.

internal import ExpoModulesJSI_Cxx
internal import jsi

public struct JavaScriptTypedArray: ~Copyable {
  /// Handle to the runtime the typed array belongs to.
  internal let runtimeHandle: JavaScriptRuntimeHandle
  /// Mutable so that ``takeValue()`` can move the engine value out of a consumed typed array.
  internal var pointee: facebook.jsi.Object

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

  /// Whether the typed array belongs to the given runtime, the runtime that created it. Use it only with the runtime it
  /// belongs to, on the thread of that runtime.
  public func belongs(to runtime: borrowing JavaScriptRuntime) -> Bool {
    return runtimeHandle === runtime.handle
  }

  /// Returns whether `object` is a supported TypedArray (excluding `DataView`, proxies, and
  /// prototype-forged objects) using the cached intrinsic `TypedArray.prototype[Symbol.toStringTag]` getter.
  internal static func isTypedArrayFallback(
    _ object: borrowing facebook.jsi.Object,
    in runtime: borrowing JavaScriptRuntime
  ) -> Bool {
    let jsiRuntime = runtime.pointee
    return JavaScriptActor.assumeIsolated {
      guard
        let getters = try? runtime.cached(JavaScriptRuntime.CacheKeys.typedArrayGetters, { try Getters(in: runtime) })
      else {
        return false
      }
      return expo.getTypedArrayKind(jsiRuntime, object, getters.toStringTag.pointee) != .Unknown
    }
  }

  /// Creates a typed array from an existing JSI object, which belongs to `runtime`.
  @JavaScriptActor
  init(_ runtime: borrowing JavaScriptRuntime, _ object: consuming facebook.jsi.Object) {
    let jsiRuntime = runtime.pointee
    self.runtimeHandle = runtime.handle
    if expo.hasNativeTypedArraySupport() {
      if expo.isUint8Array(jsiRuntime, object) {
        self.kind = .Uint8Array
      } else {
        precondition(expo.isTypedArray(jsiRuntime, object), "Value is not a typed array")
        guard
          let getters = try? runtime.cached(
            JavaScriptRuntime.CacheKeys.typedArrayGetters,
            { try Getters(in: runtime) }
          ),
          let kind = Kind(
            rawValue: Int(expo.getTypedArrayKind(jsiRuntime, object, getters.toStringTag.pointee).rawValue)
          )
        else {
          preconditionFailure("Value is not a supported typed array")
        }
        self.kind = kind
      }
      let props = expo.getNativeTypedArrayProperties(jsiRuntime, object)
      self.byteLength = Int(props.byteLength)
      self.byteOffset = Int(props.byteOffset)
      self.length = Int(props.length)
      self.arrayBuffer = expo.getNativeTypedArrayBuffer(jsiRuntime, object)
    } else {
      guard
        let getters = try? runtime.cached(
          JavaScriptRuntime.CacheKeys.typedArrayGetters,
          { try Getters(in: runtime) }
        ),
        let kind = Kind(
          rawValue: Int(expo.getTypedArrayKind(jsiRuntime, object, getters.toStringTag.pointee).rawValue)
        )
      else {
        preconditionFailure("Value is not a supported typed array")
      }
      self.kind = kind
      let props = expo.getFallbackTypedArrayProperties(
        jsiRuntime,
        object,
        getters.byteLength.pointee,
        getters.byteOffset.pointee,
        getters.length.pointee
      )
      let buffer = expo.getFallbackTypedArrayBuffer(jsiRuntime, object, getters.buffer.pointee)
      let bufferSize = expo.arrayBufferSize(jsiRuntime, buffer)
      precondition(
        props.byteOffset <= bufferSize && props.byteLength <= bufferSize - props.byteOffset,
        "TypedArray bounds exceed backing ArrayBuffer size"
      )
      self.byteLength = Int(props.byteLength)
      self.byteOffset = Int(props.byteOffset)
      self.length = Int(props.length)
      self.arrayBuffer = buffer
    }
    self.pointee = object
  }

  /// The intrinsic `TypedArray.prototype` getters, cached once per runtime. Calling them directly
  /// reads internal slots without running user code or being shadowed by own properties.
  internal final class Getters {
    let toStringTag: JavaScriptFunction
    let byteLength: JavaScriptFunction
    let byteOffset: JavaScriptFunction
    let length: JavaScriptFunction
    let buffer: JavaScriptFunction

    @JavaScriptActor
    init(in runtime: borrowing JavaScriptRuntime) throws {
      let array = try runtime.eval(
        """
        (() => {
          const proto = Object.getPrototypeOf(Uint8Array.prototype);
          const get = (k) => Object.getOwnPropertyDescriptor(proto, k).get;
          return [get(Symbol.toStringTag), get('byteLength'), get('byteOffset'), get('length'), get('buffer')];
        })()
        """
      ).getArray()
      self.toStringTag = try array.getValue(at: 0).asFunction()
      self.byteLength = try array.getValue(at: 1).asFunction()
      self.byteOffset = try array.getValue(at: 2).asFunction()
      self.length = try array.getValue(at: 3).asFunction()
      self.buffer = try array.getValue(at: 4).asFunction()
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
    return JavaScriptArrayBuffer(runtimeHandle, expo.cloneArrayBuffer(jsiRuntime, arrayBuffer))
  }

  /// Returns the typed array as a `JavaScriptValue`.
  public func asValue() -> JavaScriptValue {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtimeHandle, facebook.jsi.Value(jsiRuntime, pointee))
  }

  /// Moves the typed array into a `JavaScriptValue`, without the clone that ``asValue()`` makes.
  public consuming func takeValue() -> JavaScriptValue {
    return JavaScriptValue(runtimeHandle, expo.takeValueFromObject(&pointee))
  }

  // MARK: - Providing JavaScriptObject API

  public func getProperty(_ name: String) -> JavaScriptValue {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtimeHandle, pointee.getProperty(jsiRuntime, name))
  }
}

// MARK: - JavaScriptCodable

// A `JavaScriptTypedArray` argument receives the JS typed array of any kind unconverted, so native code
// reads and writes its bytes in place. Decoding anything else, including an `ArrayBuffer`, throws a
// `TypeError`. A typed array is an object to `JavaScriptValueKinds`, so the kind check alone can't skip
// the other objects.
extension JavaScriptTypedArray: JavaScriptCodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .object
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptTypedArray
  {
    return try value.asTypedArray()
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptTypedArray
  {
    return try value.asTypedArray(in: runtime)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: consuming JavaScriptTypedArray, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    return value.takeValue()
  }
}

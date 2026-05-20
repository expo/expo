// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 The base class for any type of the typed array.
 */
public class TypedArray: AnyTypedArray {
  /**
   Creates a concrete TypedArray from the given JavaScriptTypedArray
   */
  internal static func create(from jsTypedArray: consuming JavaScriptTypedArray) -> TypedArray {
    switch jsTypedArray.kind {
    case .Int8Array:
      return Int8Array(jsTypedArray)
    case .Int16Array:
      return Int16Array(jsTypedArray)
    case .Int32Array:
      return Int32Array(jsTypedArray)
    case .Uint8Array:
      return Uint8Array(jsTypedArray)
    case .Uint8ClampedArray:
      return Uint8ClampedArray(jsTypedArray)
    case .Uint16Array:
      return Uint16Array(jsTypedArray)
    case .Uint32Array:
      return Uint32Array(jsTypedArray)
    case .Float32Array:
      return Float32Array(jsTypedArray)
    case .Float64Array:
      return Float64Array(jsTypedArray)
    case .BigInt64Array:
      return BigInt64Array(jsTypedArray)
    case .BigUint64Array:
      return BigUint64Array(jsTypedArray)
    @unknown default:
      fatalError("Unknown kind of the TypedArray")
    }
  }

  /**
   A JavaScript object of the underlying typed array.
   */
  let jsTypedArray: JavaScriptTypedArray

  /**
   The length in bytes from the start of the underlying ArrayBuffer.
   Fixed at construction time and thus read-only.
   */
  public var byteLength: Int { jsTypedArray.byteLength }

  /**
   The offset in bytes from the start of the underlying ArrayBuffer.
   Fixed at construction time and thus read-only.
   */
  public var byteOffset: Int { jsTypedArray.byteOffset }

  /**
   Returns the number of elements held in the typed array.
   Fixed at construction time and thus read only.
   */
  public lazy var length: Int = jsTypedArray.length

  /**
   The unsafe mutable raw pointer to the start of the typed array.
   It is the beginning of the underlying ArrayBuffer, with this array's `byteOffset` applied.

   For zero-length typed arrays the underlying ArrayBuffer may have no storage, in which
   case `baseAddress` is `nil`. We substitute a non-null sentinel (`bitPattern: 1`) so the
   property can stay non-optional — callers passing this to a C API alongside `count == 0`
   won't dereference it, and any attempt to read/write crashes loudly instead of silently
   corrupting memory.
   */
  public var rawPointer: UnsafeMutableRawPointer {
    return jsTypedArray.withUnsafeMutableBytes {
      return $0.baseAddress ?? UnsafeMutableRawPointer(bitPattern: 1)!
    }
  }

  /**
   Returns the kind of the typed array, such as `Int8Array` or `Float32Array`.
   */
  public var kind: JavaScriptTypedArray.Kind {
    return jsTypedArray.kind
  }

  /**
   Initializes the typed array with the given JS typed array.
   */
  required init(_ jsTypedArray: consuming JavaScriptTypedArray) {
    self.jsTypedArray = jsTypedArray
  }
}

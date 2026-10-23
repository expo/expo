// Copyright 2025-present 650 Industries. All rights reserved.

internal import ExpoModulesJSI_Cxx
import Foundation
internal import jsi

// `Data` converts to and from a JavaScript `Uint8Array`. Decoding copies the typed array's bytes
// into `Data`; encoding copies the bytes into a new `ArrayBuffer` wrapped in a `Uint8Array`.
//
// `Data` is not in `+Primitives` because it is not a scalar. It maps to a typed array, with its own
// read/write rather than a single accessor.

extension Data: JavaScriptCodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .object
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Data
  {
    guard value.isTypedArray() else {
      throw DataNotUint8ArrayException()
    }
    let typedArray = value.getTypedArray(in: runtime)
    guard typedArray.kind == .Uint8Array else {
      throw DataNotUint8ArrayException()
    }
    return typedArray.withUnsafeBytes { bytes in
      guard typedArray.byteLength > 0, let baseAddress = bytes.baseAddress else {
        return Data()
      }
      return Data(bytes: baseAddress, count: typedArray.byteLength)
    }
  }

  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Data, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return try makeJavaScriptUint8Array(copying: value, in: runtime)
  }
}

/// Creates a JS `Uint8Array` with a copy of the given bytes.
@usableFromInline
@JavaScriptActor
internal func makeJavaScriptUint8Array(
  copying data: Data,
  in runtime: borrowing JavaScriptRuntime
) throws -> JavaScriptValue {
  let runtimeHandle = runtime.handle
  let jsiRuntime = runtime.pointee
  return try data.withUnsafeBytes { bytes in
    // The helper copies every byte, and on some React Native versions it doesn't zero the memory first.
    precondition(bytes.isEmpty || bytes.baseAddress != nil, "Data that isn't empty has no base address")
    return try capturingCppErrors {
      return JavaScriptValue(
        runtimeHandle,
        expo.createUint8Array(jsiRuntime, bytes.baseAddress?.assumingMemoryBound(to: UInt8.self), bytes.count)
      )
    }
  }
}

/// Creates a JS `Uint8Array` over the given array buffer with the global `Uint8Array` constructor, which
/// is looked up once and cached, so an encode doesn't pay for the global property lookup.
@usableFromInline
@JavaScriptActor
internal func makeJavaScriptUint8Array(
  over arrayBuffer: borrowing JavaScriptArrayBuffer,
  in runtime: borrowing JavaScriptRuntime
) throws -> JavaScriptValue {
  return try runtime.withCached(
    JavaScriptRuntime.CacheKeys.uint8ArrayConstructor,
    { try runtime.global().getPropertyAsFunction("Uint8Array") },
    { (constructor: borrowing JavaScriptFunction) in
      return try constructor.callAsConstructor(argument: arrayBuffer.asValue())
    }
  )
}

/// Thrown when decoding `Data` from a JavaScript value that is not a `Uint8Array`.
public struct DataNotUint8ArrayException: JavaScriptThrowable {
  @usableFromInline
  init() {}

  public var code: String {
    "ERR_DATA_NOT_UINT8ARRAY"
  }
  public var message: String {
    "Cannot convert a JavaScript value to Data because it is not a Uint8Array"
  }
}

// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

// `Data` converts to and from a JavaScript `Uint8Array`. Decoding copies the typed array's bytes
// into `Data`; encoding copies the bytes into a new `ArrayBuffer` wrapped in a `Uint8Array`.
//
// `Data` is not in `+Primitives` because it is not a scalar. It maps to a typed array, with its own
// read/write rather than a single accessor.

extension Data: JavaScriptCodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: JavaScriptValue, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> Data {
    guard value.isTypedArray() else {
      throw DataNotUint8ArrayException()
    }
    let typedArray = value.getTypedArray()
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
  public static func encode(_ value: Data, appContext: borrowing AppContext, runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    let arrayBuffer = runtime.createArrayBuffer(size: value.count)
    value.withUnsafeBytes { rawBuffer in
      if let baseAddress = rawBuffer.baseAddress, value.count > 0 {
        memcpy(arrayBuffer.data(), baseAddress, value.count)
      }
    }
    let uint8ArrayConstructor = try runtime.global().getPropertyAsFunction("Uint8Array")
    return try uint8ArrayConstructor.callAsConstructor(arrayBuffer.asValue())
  }
}

/// Thrown when decoding `Data` from a JavaScript value that is not a `Uint8Array`.
public final class DataNotUint8ArrayException: Exception, @unchecked Sendable {
  override public var code: String {
    "ERR_DATA_NOT_UINT8ARRAY"
  }
  override public var reason: String {
    "Cannot convert a JavaScript value to Data because it is not a Uint8Array"
  }
}

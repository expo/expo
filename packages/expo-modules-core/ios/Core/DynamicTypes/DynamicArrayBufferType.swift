// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesJSI

internal struct DynamicArrayBufferType: AnyDynamicType {
  let innerType: any AnyArrayBuffer.Type

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return innerType == InnerType.self
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    if let arrayBufferType = type as? Self {
      return arrayBufferType.innerType == innerType
    }
    return false
  }

  /// Converts JS array buffer to its native representation.
  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    if jsValue.isTypedArray() {
      let typedArray = jsValue.getTypedArray()
      let count = typedArray.byteLength

      if count == 0 {
        return ArrayBuffer.allocate(size: 0)
      }
      return try typedArray.withUnsafeBytes { bytes in
        let backingBuffer = typedArray.getArrayBuffer()
        if let borrowed = backingBuffer.tryBorrowMutableBuffer() {
          return ArrayBuffer(
            wrapping: UnsafeMutableRawPointer(borrowed.data.advanced(by: typedArray.byteOffset)),
            count: count,
            cleanup: {
              _ = borrowed
            })
        }
        return ArrayBuffer.copy(of: bytes.baseAddress!, count: count)
      }
    }
    guard jsValue.isArrayBuffer() else {
      throw NotArrayBufferException(innerType)
    }
    let jsArrayBuffer = jsValue.getArrayBuffer()

    if jsArrayBuffer.size == 0 {
      return ArrayBuffer.allocate(size: 0)
    }
    if let borrowed = jsArrayBuffer.tryBorrowMutableBuffer() {
      return ArrayBuffer(
        wrapping: UnsafeMutableRawPointer(borrowed.data),
        count: borrowed.size,
        cleanup: {
          _ = borrowed
        })
    }
    return ArrayBuffer.copy(of: UnsafeRawPointer(jsArrayBuffer.data()), count: jsArrayBuffer.size)
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    if let arrayBuffer = value as? ArrayBuffer {
      return arrayBuffer.asJavaScriptArrayBuffer(runtime: try appContext.runtime).asValue()
    }
    throw Conversions.ConversionToJSFailedException((kind: .object, nativeType: ValueType.self))
  }

  var description: String {
    return String(describing: Data.self)
  }
}

internal final class NotArrayBufferException: GenericException<any AnyArrayBuffer.Type>, @unchecked Sendable {
  override var reason: String {
    "Given argument is not an instance of \(param)"
  }
}

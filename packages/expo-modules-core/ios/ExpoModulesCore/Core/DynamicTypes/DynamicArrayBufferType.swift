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

  /**
   Converts JS array buffer to its native representation.
   */
  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    if jsValue.isTypedArray() {
      let typedArray = jsValue.getTypedArray()
      let count = typedArray.byteLength

      if count == 0 {
        return NativeArrayBuffer.allocate(size: 0)
      }
      return try typedArray.withUnsafeBytes { bytes in
        switch innerType {
        case is NativeArrayBuffer.Type:
          return NativeArrayBuffer.copy(of: bytes.baseAddress!, count: count)
        default:
          // Copy the TypedArray's view (respecting its `byteOffset` and `byteLength`) into a
          // freshly allocated JS ArrayBuffer wrapped in `ArrayBuffer`.
          // TODO: Support zero-copy views by extending `ArrayBuffer` with `byteOffset`/`byteLength`
          // so it can expose a slice of the underlying JSI buffer directly.
          let runtime = try appContext.runtime
          let newBuffer = runtime.createArrayBuffer(size: count)
          if count > 0 {
            memcpy(newBuffer.data(), bytes.baseAddress!, count)
          }
          return ArrayBuffer(newBuffer)
        }
      }
    }
    guard jsValue.isArrayBuffer() else {
      throw NotArrayBufferException(innerType)
    }
    let jsArrayBuffer = jsValue.getArrayBuffer()

    switch innerType {
    case is NativeArrayBuffer.Type:
      return NativeArrayBuffer.copy(of: UnsafeRawPointer(jsArrayBuffer.data()), count: jsArrayBuffer.size)
    default:
      return ArrayBuffer(jsArrayBuffer)
    }
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    if let nativeArrayBuffer = value as? NativeArrayBuffer {
      return nativeArrayBuffer.asJavaScriptArrayBuffer(runtime: try appContext.runtime).asValue()
    }
    if let arrayBuffer = value as? ArrayBuffer {
      return arrayBuffer.backingBuffer.asValue()
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

internal final class ArrayBufferArgumentTypeException: GenericException<any AnyArrayBuffer.Type>, @unchecked Sendable {
  override var reason: String {
    "\(param) cannot be used as argument type. Use either ArrayBuffer or NativeArrayBuffer"
  }
}

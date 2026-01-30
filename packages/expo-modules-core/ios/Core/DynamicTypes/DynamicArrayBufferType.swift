//// Copyright 2015-present 650 Industries. All rights reserved.
//
//internal struct DynamicArrayBufferType: AnyDynamicType {
//  let innerType: AnyArrayBuffer.Type
//
//  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
//    return innerType == InnerType.self
//  }
//
//  func equals(_ type: AnyDynamicType) -> Bool {
//    if let arrayBufferType = type as? Self {
//      return arrayBufferType.innerType == innerType
//    }
//    return false
//  }
//
//  /**
//   Converts JS array buffer to its native representation.
//   */
//  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
//    guard let rawArrayBuffer = jsValue.getArrayBuffer() else {
//      throw NotArrayBufferException(innerType)
//    }
//    let jsArrayBuffer = JavaScriptArrayBuffer(rawArrayBuffer)
//
//    return switch innerType {
//      case is JavaScriptArrayBuffer.Type: jsArrayBuffer
//      case is NativeArrayBuffer.Type: jsArrayBuffer.copy()
//      // this might happen when a user implemented own subclass of ArrayBuffer
//      // or uses 'ArrayBuffer' directly
//      default: throw ArrayBufferArgumentTypeException(innerType)
//    }
//  }
//
//  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any {
//    guard let arrayBuffer = result as? ArrayBuffer else {
//      throw Conversions.ConversionToJSFailedException((kind: .object, nativeType: ResultType.self))
//    }
//    return arrayBuffer.backingBuffer
//  }
//
//  var description: String {
//    return String(describing: Data.self)
//  }
//}
//
//internal final class NotArrayBufferException: GenericException<AnyArrayBuffer.Type>, @unchecked Sendable {
//  override var reason: String {
//    "Given argument is not an instance of \(param)"
//  }
//}
//
//internal final class ArrayBufferArgumentTypeException: GenericException<AnyArrayBuffer.Type>, @unchecked Sendable {
//  override var reason: String {
//    "\(param) cannot be used as argument type. Use either JavaScriptArrayBuffer or NativeArrayBuffer"
//  }
//}

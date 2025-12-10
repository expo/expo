// Copyright 2015-present 650 Industries. All rights reserved.

internal struct DynamicArrayBufferType: AnyDynamicType {
  let innerType: AnyArrayBuffer.Type

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
    guard let rawArrayBuffer = jsValue.getArrayBuffer() else {
      throw NotArrayBufferException(innerType)
    }
    let jsArrayBuffer = JavaScriptArrayBuffer(rawArrayBuffer)

    return switch innerType {
      case is JavaScriptArrayBuffer.Type: jsArrayBuffer
      case is NativeArrayBuffer.Type: jsArrayBuffer.copy()
    case is ArrayBuffer.Type:
      throw Exception(name: "ArgumentTypeError", description: "You need to specify either JavaScriptArrayBuffer or NativeArrayBuffer as argument type")
        // this should never happen - it means ExpoModulesCore has implemented another ArrayBuffer type
        // that is not casted here
      // also, it could happen when a user implemented own subclass of ArrayBuffer
      default: throw NotArrayBufferException(innerType)
    }
  }

    func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any {
      guard let arrayBuffer = result as? ArrayBuffer else {
            throw Conversions.ConversionToJSFailedException((kind: .object, nativeType: ResultType.self))
        }
      return arrayBuffer.backingBuffer
    }

  var description: String {
    return String(describing: Data.self)
  }
}

internal final class NotArrayBufferException: GenericException<AnyArrayBuffer.Type>, @unchecked Sendable {
  override var reason: String {
    "Given argument is not an instance of \(param)"
  }
}

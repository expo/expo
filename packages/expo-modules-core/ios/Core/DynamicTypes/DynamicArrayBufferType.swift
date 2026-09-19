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
    do {
      return try ArrayBuffer.from(value: jsValue, in: try appContext.runtime)
    } catch is ArrayBufferJavaScriptValueConversionException {
      throw NotArrayBufferException(innerType)
    }
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    return try castToJS(value, appContext: appContext, in: try appContext.runtime)
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext, in runtime: JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    if let arrayBuffer = value as? ArrayBuffer {
      return arrayBuffer.asJavaScriptArrayBuffer(runtime: runtime).asValue()
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

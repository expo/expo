// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 Dynamic type for values that conform to `Encodable` and/or `Decodable`. Native→JS
 goes through `JSValueEncoder` (requires `Encodable`); JS→native goes through
 `JSValueDecoder` (requires `Decodable`). Either direction throws if the wrapped
 type doesn't conform to the protocol it needs.
 */
internal struct DynamicCodableType<InnerType>: AnyDynamicType {
  func wraps<AnyInnerType>(_ type: AnyInnerType.Type) -> Bool {
    return type == InnerType.self
  }

  func equals(_ type: any AnyDynamicType) -> Bool {
    return type is Self
  }

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    guard let DecodableType = InnerType.self as? Decodable.Type else {
      throw Conversions.CastingJSValueException<InnerType>(jsValue.kind)
    }
    let decoder = try JSValueDecoder(value: jsValue, appContext: appContext)
    return try DecodableType.init(from: decoder)
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    if let value = value as? InnerType {
      return value
    }
    throw Conversions.CastingException<InnerType>(value)
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    return try castToJS(value, appContext: appContext, in: try appContext.runtime)
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext, in runtime: JavaScriptRuntime) throws -> JavaScriptValue {
    if let value = value as? JavaScriptValue {
      return value
    }
    if let value = value as? Encodable {
      let encoder = JSValueEncoder(appContext: appContext, runtime: runtime)
      try value.encode(to: encoder)
      return encoder.value
    }
    throw Conversions.ConversionToJSFailedException((kind: .object, nativeType: ValueType.self))
  }

  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any {
    // TODO: We should get rid of this function, but it seems it's still used in some places
    return try castToJS(result, appContext: appContext)
  }

  var description: String {
    "Codable<\(InnerType.self)>"
  }
}

// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Dynamic type for values conforming to `Encodable` protocol.
 Note that currently it can only encode from native to JavaScript values, thus cannot be used for arguments.
 */
internal struct DynamicEncodableType: AnyDynamicType {
  static let shared = DynamicEncodableType()

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return type is Encodable
  }

  func equals(_ type: any AnyDynamicType) -> Bool {
    // Just mocking it here as we don't really need this function and we rather want to keep it a singleton
    return false
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    // TODO: Create DynamicDecodableType and reuse it here – that would work perfectly with Codable types
    fatalError("DynamicEncodableType can only cast to JavaScript, not from")
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    if let value = value as? JavaScriptValue {
      return value
    }
    if let value = value as? Encodable {
      let runtime = try appContext.runtime
      let encoder = JSValueEncoder(runtime: runtime)

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
    "Encodable"
  }
}

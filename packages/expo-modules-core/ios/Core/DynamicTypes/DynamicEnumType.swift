// Copyright 2021-present 650 Industries. All rights reserved.

/**
 A dynamic type representing an enum that conforms to `Enumerable`.
 */
internal struct DynamicEnumType: AnyDynamicType {
  let innerType: any Enumerable.Type

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return innerType == InnerType.self
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    if let enumType = type as? Self {
      return enumType.innerType == innerType
    }
    return false
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    return try innerType.create(fromRawValue: value)
  }

  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any {
    // Pass-through: the enum is unwrapped to its raw value in `castToJS` instead.
    // `convertResult` is on its way out — once all dynamic types convert directly to JS,
    // this hook can be removed entirely.
    return result
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    if let value = value as? any Enumerable {
      return try innerType.getRawValueDynamicType().castToJS(value.anyRawValue, appContext: appContext)
    }
    throw Conversions.ConversionToJSFailedException((kind: .undefined, nativeType: ValueType.self))
  }

  var description: String {
    "Enum<\(innerType)>"
  }
}

// Copyright 2021-present 650 Industries. All rights reserved.

import ExpoModulesJSI

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

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    let rawValue = try innerType.getRawValueDynamicType().cast(jsValue: jsValue, appContext: appContext)
    return try innerType.create(fromRawValue: rawValue)
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    // Idempotent: `MainValueConverter.toNative` calls this after `cast(jsValue:)`,
    // which already hydrates the enum. Pass it through unchanged in that case.
    if let value = value as? any Enumerable, type(of: value) == innerType {
      return value
    }
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

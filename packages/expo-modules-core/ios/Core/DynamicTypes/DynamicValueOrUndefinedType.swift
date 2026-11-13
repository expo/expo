// Copyright 2021-present 650 Industries. All rights reserved.

import ExpoModulesJSI

internal struct DynamicValueOrUndefinedType<InnerType: AnyArgument>: AnyDynamicType {
  let innerType: InnerType.Type = InnerType.self
  let dynamicInnerType: AnyDynamicType = InnerType.getDynamicType()

  func wraps<AnyInnerType>(_ type: AnyInnerType.Type) -> Bool {
    return innerType == type
  }

  func equals(_ type: any AnyDynamicType) -> Bool {
    return type is Self
  }

  func cast(jsValue: borrowing JavaScriptValue, appContext: AppContext) throws -> Any {
    if jsValue.isUndefined() {
      return ValueOrUndefined<InnerType>.undefined
    }
    let unwrapped = try dynamicInnerType.cast(jsValue: jsValue, appContext: appContext) as! InnerType
    return ValueOrUndefined<InnerType>.value(unwrapped: unwrapped)
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    if value is ValueOrUndefined<InnerType> {
      return value
    }

    return ValueOrUndefined<InnerType>.value(unwrapped: try dynamicInnerType.cast(value, appContext: appContext) as! InnerType)
  }

  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any {
    let value = result as! ValueOrUndefined<InnerType>
    if case .undefined = value {
      // The shared box holds no engine value and creates `undefined` when read, so it is safe to return here, even off the JS thread.
      return ConvertedJavaScriptValue.undefined
    }
    return try dynamicInnerType.convertResult(value.optional, appContext: appContext)
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    if let converted = value as? ConvertedJavaScriptValue {
      return converted.takeValue()
    }
    return try dynamicInnerType.castToJS(value, appContext: appContext)
  }

  var description: String {
    return "ValueOrUndefined<\(dynamicInnerType)>"
  }
}

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

    return try dynamicInnerType.cast(jsValue: jsValue, appContext: appContext)
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
      // JavaScriptValue.undefined is not runtime specific, so it's safe to return here, even if it's not on the JS thread.
      return Any?.none as Any
    }
    return try dynamicInnerType.convertResult(value.optional, appContext: appContext)
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
//    if let jaValue = value as? JavaScriptValue {
//      return jaValue
//    }
    return try dynamicInnerType.castToJS(value, appContext: appContext)
  }

  var description: String {
    return "ValueOrUndefined<\(dynamicInnerType)>"
  }
}

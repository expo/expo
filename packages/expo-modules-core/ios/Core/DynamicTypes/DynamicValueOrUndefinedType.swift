// Copyright 2021-present 650 Industries. All rights reserved.

internal struct DynamicValueOrUndefinedType<InnerType: AnyArgument>: AnyDynamicType {
  let innerType: InnerType.Type = InnerType.self
  let dynamicInnerType: AnyDynamicType = InnerType.getDynamicType()

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return innerType == type
  }

  func equals(_ type: any AnyDynamicType) -> Bool {
    return type is Self
  }

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
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

  var description: String {
    return "ValueOrUndefined<\(dynamicInnerType)>"
  }
}

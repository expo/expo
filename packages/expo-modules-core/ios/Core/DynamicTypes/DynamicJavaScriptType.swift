// Copyright 2022-present 650 Industries. All rights reserved.

/**
 A dynamic type representing various types of JavaScript values.
 */
internal struct DynamicJavaScriptType: AnyDynamicType {
  let innerType: AnyJavaScriptValue.Type

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return innerType == InnerType.self
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    if let providedType = type as? Self {
      return providedType.innerType == innerType
    }
    return false
  }

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    return try innerType.convert(from: jsValue, appContext: appContext)
  }

  var description: String {
    return String(describing: innerType.self)
  }
}

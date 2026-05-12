// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 A dynamic type representing various types of JavaScript values.
 */
internal struct DynamicJavaScriptType: AnyDynamicType {
  static let shared = DynamicJavaScriptType()

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return type == JavaScriptValue.self
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    return type is Self
  }

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    return jsValue
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    if let value = value as? JavaScriptValue {
      return value
    }
    throw Conversions.ConversionToJSFailedException((kind: .undefined, nativeType: ValueType.self))
  }

  var description: String {
    return "JavaScriptValue"
  }
}

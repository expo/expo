// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 A dynamic type representing various types of JavaScript values.
 */
internal struct DynamicJavaScriptType: AnyDynamicType {
  static let shared = DynamicJavaScriptType()

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    // A DSL function argument or field may be declared as `JavaScriptValueRef`, the form that keeps
    // working once JavaScriptValue is non-copyable and cannot travel through `Any`.
    return type == JavaScriptValue.self || type == JavaScriptValueRef.self
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
    if let value = value as? JavaScriptValueRef {
      return value.asValue()
    }
    throw Conversions.ConversionToJSFailedException((kind: .undefined, nativeType: ValueType.self))
  }

  var description: String {
    return "JavaScriptValue"
  }
}

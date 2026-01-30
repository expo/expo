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

  func cast(jsValue: borrowing JavaScriptValue, appContext: AppContext) throws -> Any {
    if #available(iOS 18.0, *) {
      return self
    } else {
      fatalError()
    }
  }

  var description: String {
    return "JavaScriptValue"
  }
}

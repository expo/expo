// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 A dynamic type for the `Callback` argument.
 */
internal struct DynamicCallbackType: AnyDynamicType {
  static let shared = DynamicCallbackType()

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return type == Callback.self
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    return type is Self
  }

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    return try Callback.from(jsValue, runtime: try appContext.runtime, appContext: appContext)
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    if let callback = value as? Callback {
      return callback
    }
    throw Conversions.CastingException<Callback>(value)
  }

  var description: String {
    return "Callback"
  }
}

// Copyright 2025-present 650 Industries. All rights reserved.

internal struct DynamicJSCallbackType: AnyDynamicType {

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return type == JSCallback.self
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    return type is DynamicJSCallbackType
  }

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    guard jsValue.kind == .function else {
      throw Conversions.CastingException<JSCallback>(jsValue)
    }
    return JSCallback(rawFunction: jsValue.getFunction(), appContext: appContext)
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    if let callback = value as? JSCallback {
      return callback
    }
    throw Conversions.CastingException<JSCallback>(value)
  }

  var description: String { "JSCallback" }
}

// Copyright 2024-present 650 Industries. All rights reserved.

internal struct DynamicVoidType: AnyDynamicType {
  static let shared = DynamicVoidType()

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return type == Void.self
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    return type is Self
  }

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    return Optional<Any>.none as Any
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    return value
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    return .undefined
  }

  var description: String {
    "Void"
  }
}

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

  // `JavaScriptValue` is non-copyable, so it can neither be boxed in `Any` nor appear in a definition
  // closure's argument tuple or result. The compiler rejects such a definition, so these paths are
  // unreachable from the DSL; they throw for completeness.
  func cast(jsValue: borrowing JavaScriptValue, appContext: AppContext) throws -> Any {
    throw NonCopyableValueException()
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    throw NonCopyableValueException()
  }

  var description: String {
    return "JavaScriptValue"
  }
}

internal final class NonCopyableValueException: Exception, @unchecked Sendable {
  override var reason: String {
    return "JavaScriptValue is non-copyable and cannot be passed through the module definition as a native value"
  }
}

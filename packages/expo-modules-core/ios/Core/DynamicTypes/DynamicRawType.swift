// Copyright 2021-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 A dynamic type that can wrap any type, but it casts only type-compatible values using `as?` keyword.
 The innermost type of the other dynamic types like `ArrayArgumentType` and `OptionalArgumentType`.
 */
internal struct DynamicRawType<InnerType>: AnyDynamicType {
  let innerType: InnerType.Type

  func wraps<AnyInnerType>(_ type: AnyInnerType.Type) -> Bool {
    return type == innerType
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    return type is Self
  }

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    return try cast(jsValue.getAny(), appContext: appContext)
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    if let value = value as? InnerType {
      return value
    }
    // Sometimes conversion from Double to Float will fail due to precision losses. We can accept them though.
    if let value = value as? Double, wraps(Float.self) {
      return Float(value)
    }
    // Raw types are always non-optional, but they may receive `nil` values.
    // Let's throw more specific error in this case.
    if Optional.isNil(value) {
      throw Conversions.NullCastException<InnerType>()
    }
    throw Conversions.CastingException<InnerType>(value)
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext) throws -> JavaScriptValue {
    return try castToJS(value, appContext: appContext, in: try appContext.runtime)
  }

  func castToJS<ValueType>(_ value: ValueType, appContext: AppContext, in runtime: JavaScriptRuntime) throws -> JavaScriptValue {
    if Optional.isNil(value) {
      return .null
    }
    // When `InnerType` is `Any` (e.g. `[String: Any]` value slot), the runtime type of the
    // value is more specific than the static type, so we dispatch on it to reach proper
    // handlers like `DynamicEnumType.castToJS`. Guarded against infinite recursion: the
    // dispatch only kicks in when the value's runtime type differs from `innerType`.
    if InnerType.self != type(of: value as Any), let argument = value as? AnyArgument {
      return try type(of: argument).getDynamicType().castToJS(argument, appContext: appContext, in: runtime)
    }
    return try Conversions.unknownToJavaScriptValue(value, appContext: appContext, in: runtime)
  }

  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any {
    // TODO: Definitions and JS object builders should have its own dynamic type.
    // We use `DynamicRawType` for this only temporarily.
    if let objectBuilder = result as? JavaScriptObjectBuilder {
      return try JavaScriptActor.assumeIsolated {
        return try objectBuilder.build(appContext: appContext).asValue()
      }
    }
    return result
  }

  var description: String {
    String(describing: innerType.self)
  }
}

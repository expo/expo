// Copyright 2021-present 650 Industries. All rights reserved.

/**
 A dynamic type that can wrap any type, but it casts only type-compatible values using `as?` keyword.
 The innermost type of the other dynamic types like `ArrayArgumentType` and `OptionalArgumentType`.
 */
internal struct DynamicRawType<InnerType>: AnyDynamicType {
  let innerType: InnerType.Type

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return type == innerType
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    return type is Self
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

  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any {
    // TODO: Definitions and JS object builders should have its own dynamic type.
    // We use `DynamicRawType` for this only temporarily.
    if let objectBuilder = result as? JavaScriptObjectBuilder {
      return try objectBuilder.build(appContext: appContext) as Any
    }
    return result
  }

  var description: String {
    String(describing: innerType.self)
  }
}

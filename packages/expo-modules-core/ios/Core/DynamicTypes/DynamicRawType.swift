// Copyright 2021-present 650 Industries. All rights reserved.

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

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    // Swift's `as? Bool` matches any NSNumber with value 0 or 1, not just actual booleans
    // This causes `Either<Bool, Double>` to incorrectly decode numbers 0/1 as Bool instead of Double.
    // Guard against this by checking CFBooleanGetTypeID for Bool casts on NSNumber values.
    if InnerType.self == Bool.self, let nsNumber = value as? NSNumber {
      guard CFGetTypeID(nsNumber) == CFBooleanGetTypeID() else {
        throw Conversions.CastingException<InnerType>(value)
      }
      return nsNumber.boolValue
    }
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
      return try JavaScriptActor.assumeIsolated {
        return try objectBuilder.build(appContext: appContext)
      } as Any
    }
    return result
  }

  var description: String {
    String(describing: innerType.self)
  }
}

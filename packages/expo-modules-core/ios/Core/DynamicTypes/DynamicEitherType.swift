// Copyright 2024-present 650 Industries. All rights reserved.

internal struct DynamicEitherType<EitherType: AnyEither>: AnyDynamicType {
  let eitherType: EitherType.Type

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return eitherType.dynamicTypes().contains { eitherType in
      return eitherType.wraps(type)
    }
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    return type is Self
  }

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    let types = eitherType.dynamicTypes()

    for type in types {
      if let preliminaryValue = try? type.cast(jsValue: jsValue, appContext: appContext),
        let value = try? type.cast(preliminaryValue, appContext: appContext) {
        return EitherType(value)
      }
    }
    throw NeitherTypeException(types)
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    if let value = value as? EitherType {
      return value
    }
    let types = eitherType.dynamicTypes()

    for type in types {
      // Initialize the "either" when the current type can cast given value.
      if let value = try? type.cast(value, appContext: appContext) {
        return EitherType(value)
      }
    }
    throw NeitherTypeException(types)
  }

  func convertResult<ResultType>(_ result: ResultType, appContext: AppContext) throws -> Any {
    guard let either = result as? EitherType else {
      throw Conversions.CastingException<EitherType>(result)
    }

    let types = eitherType.dynamicTypes()

    // Try each type - one should succeed
    for type in types {
      if let converted = try? type.convertResult(either.value, appContext: appContext) {
        return converted
      }
    }

    throw NeitherTypeException(types)
  }

  var description: String {
    let types = eitherType.dynamicTypes()
    return "Either<\(types.map(\.description).joined(separator: ", "))>"
  }
}

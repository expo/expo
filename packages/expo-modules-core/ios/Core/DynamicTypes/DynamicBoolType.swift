// Copyright 2024-present 650 Industries. All rights reserved.

internal struct DynamicBoolType: AnyDynamicType {
  static let shared = DynamicBoolType()

  func wraps<InnerType>(_ type: InnerType.Type) -> Bool {
    return type == Swift.Bool.self
  }

  func equals(_ type: AnyDynamicType) -> Bool {
    return type is Self
  }

  func cast<ValueType>(_ value: ValueType, appContext: AppContext) throws -> Any {
    if Optional.isNil(value) {
      throw Conversions.NullCastException<Bool>()
    }
    // `as? Bool` matches any NSNumber with value 0 or 1, not just actual booleans
    // This causes `Either<Bool, Double>` to incorrectly decode numbers 0/1 as Bool instead of Double.
    if let nsNumber = value as? NSNumber {
      guard CFGetTypeID(nsNumber) == CFBooleanGetTypeID() else {
        throw Conversions.CastingException<Bool>(value)
      }
      return nsNumber.boolValue
    }
    throw Conversions.CastingException<Bool>(value)
  }

  func cast(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any {
    if jsValue.kind == .bool {
      return jsValue.getBool()
    }
    throw Conversions.ConversionToNativeFailedException((kind: jsValue.kind, nativeType: Bool.self))
  }

  var description: String {
    "Bool"
  }
}

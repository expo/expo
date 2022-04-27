// Copyright 2021-present 650 Industries. All rights reserved.

/**
 An argument type that can wrap any type, but it casts only type-compatible values using `as?` keyword.
 The innermost type of other argument types like `ArrayArgumentType` and `OptionalArgumentType`.
 */
internal struct RawArgumentType<InnerType>: AnyArgumentType {
  let innerType: InnerType.Type

  func cast<ArgType>(_ value: ArgType) throws -> Any {
    if let value = value as? InnerType {
      return value
    }
    // Raw arguments are always non-optional, but they may receive `nil` values.
    // Let's throw more specific error in this case.
    if Optional.isNil(value) {
      throw Conversions.NullCastException<InnerType>()
    }
    throw Conversions.CastingException<InnerType>(value)
  }

  var description: String {
    String(describing: innerType.self)
  }
}

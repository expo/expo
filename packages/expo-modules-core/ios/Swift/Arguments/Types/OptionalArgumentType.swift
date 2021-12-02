// Copyright 2021-present 650 Industries. All rights reserved.

/**
 An argument type that represents an optional type, which allows `nil` to be passed when casting.
 Requires the argument type for optional's unwrapped type as it delegates casting to that type for non-nil values.
 */
internal struct OptionalArgumentType: AnyArgumentType {
  let wrappedType: AnyArgumentType

  func cast<ArgType>(_ value: ArgType) throws -> Any {
    if Optional.isNil(value) {
      return Optional<Any>.none as Any
    }
    return try wrappedType.cast(value)
  }

  var description: String {
    "\(wrappedType)?"
  }
}

/**
 A type-erased protocol used to recognize if the generic type is an optional type.
 `Optional` is a generic enum, so it's impossible to check the inheritance directly.
 */
internal protocol AnyOptionalArgument: AnyArgument {
  /**
   Exposes the `Wrapped` generic type wrapped by the argument type to preserve its metadata.`
   */
  static func getWrappedArgumentType() -> AnyArgumentType
}

/**
 Make generic `Optional` implement non-generic `AnyOptional` and add handy check against type-erased `nil`.
 */
extension Optional: AnyOptionalArgument {
  static func getWrappedArgumentType() -> AnyArgumentType {
    return ArgumentType(Wrapped.self)
  }

  static func isNil(_ object: Wrapped) -> Bool {
    switch object as Any {
    case Optional<Any>.none:
      return true
    default:
      return false
    }
  }
}

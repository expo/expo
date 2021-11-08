// Copyright 2021-present 650 Industries. All rights reserved.

/**
 Class conforming to `AnyArgumentType` that wraps any kind of type.
 */
internal class RawArgumentType<InnerType>: AnyArgumentType, CustomStringConvertible {
  let innerType: Any.Type

  let isOptional: Bool

  init(_ innerType: InnerType.Type) {
    self.innerType = innerType
    self.isOptional = innerType is AnyOptional.Type
  }

  func isKindOf<ParentType>(_ type: ParentType.Type) -> Bool {
    return innerType is ParentType.Type
  }

  func cast<ArgType>(_ value: ArgType) throws -> Any {
    // Precheck against nil passed to non-optional type.
    guard isOptional || !Optional.isNil(value) else {
      throw Conversions.NullCastError<InnerType>()
    }
    return try castNonOptional(value)
  }

  func castNonOptional<ArgType>(_ value: ArgType) throws -> Any {
    if let ConvertibleInnerType = InnerType.self as? ConvertibleArgument.Type {
      return try ConvertibleInnerType.convert(from: value)
    }
    if let value = value as? InnerType {
      return value
    }
    throw Conversions.CastingError<InnerType>(value: value)
  }

  // MARK: CustomStringConvertible

  var description: String {
    return String(describing: InnerType.self)
  }
}

/**
 A type-erased protocol used to recognize if the generic type is an optional type.
 `Optional` is a generic enum, so it's impossible to check the inheritance directly.
 */
internal protocol AnyOptional {}

/**
 Make generic `Optional` implement non-generic `AnyOptional` and add handy check against type-erased `nil`.
 */
extension Optional: AnyOptional {
  static func isNil(_ object: Wrapped) -> Bool {
    switch object as Any {
    case Optional<Any>.none:
      return true
    default:
      return false
    }
  }
}

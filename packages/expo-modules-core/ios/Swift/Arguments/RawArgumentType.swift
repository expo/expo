// Copyright 2021-present 650 Industries. All rights reserved.

/**
 Class conforming to `AnyArgumentType` that wraps any kind of type.
 */
internal class RawArgumentType<InnerType>: AnyArgumentType, CustomStringConvertible {
  let innerType: Any.Type

  init(_ innerType: InnerType.Type) {
    self.innerType = innerType
  }

  func isKindOf<ParentType>(_ type: ParentType.Type) -> Bool {
    return InnerType.self is ParentType.Type
  }

  func cast<ArgType>(_ value: ArgType) throws -> Any {
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

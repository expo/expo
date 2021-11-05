// Copyright 2021-present 650 Industries. All rights reserved.

/**
 Class conforming to `AnyArgumentType` that wraps array types.
 */
internal final class CollectionArgumentType<InnerType: RandomAccessCollection>: RawArgumentType<InnerType> {
  var elementType: AnyArgumentType

  init(_ innerType: InnerType.Type, _ elementType: AnyArgumentType) {
    self.elementType = elementType
    super.init(InnerType.self)
  }

  override func cast<ArgType>(_ value: ArgType) throws -> Any {
    if let value = value as? [Any] {
      return try value.map { try elementType.cast($0) }
    }
    throw Conversions.CastingError<InnerType>(value: value)
  }

  // MARK: CustomStringConvertible

  override var description: String {
    "[\(elementType.description)]"
  }
}

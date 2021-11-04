// Copyright 2021-present 650 Industries. All rights reserved.

/**
 Class conforming to `AnyArgumentType` that wraps array types.
 */
internal final class CollectionArgumentType<InnerType: RandomAccessCollection, ElementType>: RawArgumentType<InnerType> {
  var elementType: AnyArgumentType

  /**
   Initializer used when the element type is not well-known (protocol conformance is unknown).
   */
  init(_ innerType: InnerType.Type, _ elementType: ElementType.Type) {
    self.elementType = RawArgumentType(ElementType.self)
    super.init(InnerType.self)
  }

  /**
   Initializer used when the element type is also an array type.
   */
  init(_ innerType: InnerType.Type, _ elementType: ElementType.Type) where ElementType: RandomAccessCollection {
    self.elementType = ArgumentType(ElementType.self)
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

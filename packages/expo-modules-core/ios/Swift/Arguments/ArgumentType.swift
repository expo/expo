// Copyright 2021-present 650 Industries. All rights reserved.

/**
 Factory creating an instance of the argument type wrapper conforming to `AnyArgumentType`.
 Depending on the given type, it may return one of `ArrayArgumentType`, `OptionalArgumentType`, `ConvertibleArgumentType`, etc.
 */
internal func ArgumentType<T>(_ type: T.Type) -> AnyArgumentType {
  if let ArrayType = T.self as? AnyArrayArgument.Type {
    return ArrayArgumentType(elementType: ArrayType.getElementArgumentType())
  }
  if let OptionalType = T.self as? AnyOptionalArgument.Type {
    return OptionalArgumentType(wrappedType: OptionalType.getWrappedArgumentType())
  }
  if let ConvertibleType = T.self as? ConvertibleArgument.Type {
    return ConvertibleArgumentType(innerType: ConvertibleType)
  }
  if let EnumType = T.self as? EnumArgument.Type {
    return EnumArgumentType(innerType: EnumType)
  }
  if T.self is Promise.Type {
    return PromiseArgumentType()
  }
  return RawArgumentType(innerType: T.self)
}

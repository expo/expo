// Copyright 2021-present 650 Industries. All rights reserved.

/**
 Factory creating a `RawArgumentType` conforming to `AnyArgumentType`.
 */
internal func ArgumentType<T>(_ type: T.Type) -> AnyArgumentType {
  return RawArgumentType(T.self)
}

/**
 Factory creating a `CollectionArgumentType` conforming to `AnyArgumentType` that handles array types.
 Its element type will be `RawArgumentType` since `T.Element` protocol conformance is unknown.
 */
internal func ArgumentType<T>(_ type: T.Type) -> AnyArgumentType where T: RandomAccessCollection {
  return CollectionArgumentType(T.self, ArgumentType(T.Element.self))
}

/**
 Factory creating an instance of `CollectionArgumentType` conforming to `AnyArgumentType` that handles array of arrays types.
 Its element type will be `CollectionArgumentType` since `T.Element` is constrained to be an array too.
 */
internal func ArgumentType<T>(_ type: T.Type) -> AnyArgumentType where T: RandomAccessCollection, T.Element: RandomAccessCollection {
  return CollectionArgumentType(T.self, ArgumentType(T.Element.self))
}

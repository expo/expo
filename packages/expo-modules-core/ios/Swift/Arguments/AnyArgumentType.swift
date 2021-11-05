// Copyright 2021-present 650 Industries. All rights reserved.

/**
 A protocol whose intention is to wrap method argument type
 to keep its real signature and not type-erase it by the compiler.
 */
internal protocol AnyArgumentType: CustomStringConvertible {
  /**
   Returns a boolean value that indicates whether the wrapped type inherits or conforms to the given type.
   */
  func isKindOf<ParentType>(_ type: ParentType.Type) -> Bool

  /**
   Casts given any value to the wrapped type and returns as `Any`.
   NOTE: It may not be just simple type-casting (e.g. when the wrapped type conforms to `ConvertibleArgument`).
   */
  func cast<ArgType>(_ value: ArgType) throws -> Any
}

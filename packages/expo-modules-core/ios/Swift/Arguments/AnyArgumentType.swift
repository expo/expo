// Copyright 2021-present 650 Industries. All rights reserved.

/**
 A protocol whose intention is to wrap function's argument type
 to keep its real signature and not type-erase it by the compiler.
 */
public protocol AnyArgumentType: CustomStringConvertible {
  /**
   Checks whether the inner type is the same as the given type.
   */
  func wraps<InnerType>(_ type: InnerType.Type) -> Bool

  /**
   Checks whether the argument type is equal to another.
   */
  func equals(_ type: AnyArgumentType) -> Bool

  /**
   Casts given any value to the wrapped type and returns as `Any`.
   NOTE: It may not be just simple type-casting (e.g. when the wrapped type conforms to `ConvertibleArgument`).
   */
  func cast<ArgType>(_ value: ArgType) throws -> Any
}

// MARK: - Operators

infix operator ~>
public func ~> <T>(lhs: AnyArgumentType, rhs: T.Type) -> Bool {
  return lhs.wraps(rhs)
}

infix operator !~>
public func !~> <T>(lhs: AnyArgumentType, rhs: T.Type) -> Bool {
  return !lhs.wraps(rhs)
}

public func == (lhs: AnyArgumentType, rhs: AnyArgumentType) -> Bool {
  return lhs.equals(rhs)
}

public func != (lhs: AnyArgumentType, rhs: AnyArgumentType) -> Bool {
  return !lhs.equals(rhs)
}

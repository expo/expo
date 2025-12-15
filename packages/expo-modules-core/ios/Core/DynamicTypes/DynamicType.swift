// Copyright 2021-present 650 Industries. All rights reserved.

// Function names should start with a lowercase character, but in this one case
// we want it to be uppercase as we treat it more like a generic class.
// swiftlint:disable identifier_name

/**
 Factory creating an instance of the dynamic type wrapper conforming to `AnyDynamicType`.
 Depending on the given type, it may return one of `DynamicArrayType`, `DynamicOptionalType`, `DynamicConvertibleType`, etc.
 It does some type checks in runtime when the type's conformance/inheritance is unknown for the compiler.
 See the `~` prefix operator overloads that are used for types known for the compiler.
 You can add more type checks for types that don't conform to `AnyArgument`, but are allowed to be used as return types.
 `Void` is a good example as it cannot conform to anything or language protocols that cannot be extended to implement `AnyArgument`.
 */
private func DynamicType<T>(_ type: T.Type) -> AnyDynamicType {
  if let AnyArgumentType = T.self as? AnyArgument.Type {
    return AnyArgumentType.getDynamicType()
  }
  if T.self == Void.self {
    return DynamicVoidType.shared
  }
  if T.self is Encodable.Type {
    // There is no dedicated `~` operator overload for encodables to avoid ambiguity
    // when the type is both `AnyArgument` and `Encodable` (e.g. strings, numeric types).
    return DynamicEncodableType.shared
  }
  return DynamicRawType(innerType: T.self)
}

/**
 Handy prefix operator that makes the dynamic type from the static type.
 */
prefix operator ~
internal prefix func ~ <T>(type: T.Type) -> AnyDynamicType {
  return DynamicType(type)
}

internal prefix func ~ <T>(type: T.Type) -> AnyDynamicType where T: AnyArgument {
  return T.getDynamicType()
}

internal prefix func ~ (type: Void.Type) -> AnyDynamicType {
  return DynamicVoidType.shared
}

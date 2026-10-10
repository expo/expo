// Copyright 2021-present 650 Industries. All rights reserved.

// Function names should start with a lowercase character, but in this one case
// we want it to be uppercase as we treat it more like a generic class.
// swiftlint:disable identifier_name

import Foundation

private enum DynamicTypeKind {
  case anyArgument(AnyArgument.Type)
  case void
  case codable
  case raw
}

private final class DynamicTypeKindCache: @unchecked Sendable {
  static let shared = DynamicTypeKindCache()
  private var kinds = [ObjectIdentifier: DynamicTypeKind]()
  private let lock = NSLock()

  func kind<T>(of type: T.Type) -> DynamicTypeKind {
    let key = ObjectIdentifier(T.self)
    lock.lock()
    if let kind = kinds[key] {
      lock.unlock()
      return kind
    }
    lock.unlock()

    let kind: DynamicTypeKind
    if let AnyArgumentType = T.self as? AnyArgument.Type {
      kind = .anyArgument(AnyArgumentType)
    } else if T.self == Void.self {
      kind = .void
    } else if T.self is Encodable.Type || T.self is Decodable.Type {
      kind = .codable
    } else {
      kind = .raw
    }
    lock.lock()
    kinds[key] = kind
    lock.unlock()
    return kind
  }
}

private func DynamicType<T>(_ type: T.Type) -> AnyDynamicType {
  // The protocol-conformance checks below are full conformance-table scans per (type, protocol);
  // the answer is a property of the type, so remember it and keep creating fresh instances.
  switch DynamicTypeKindCache.shared.kind(of: type) {
  case .anyArgument(let AnyArgumentType):
    return AnyArgumentType.getDynamicType()
  case .void:
    return DynamicVoidType.shared
  case .codable:
    // There is no dedicated `~` operator overload for Codable types to avoid ambiguity
    // when the type is both `AnyArgument` and `Encodable`/`Decodable` (e.g. strings, numeric types).
    return DynamicCodableType<T>()
  case .raw:
    return DynamicRawType(innerType: T.self)
  }
}

/**
 Handy prefix operator that makes the dynamic type from the static type.
 */
prefix operator ~
/**
 Factory creating an instance of the dynamic type wrapper conforming to `AnyDynamicType`.
 Depending on the given type, it may return one of `DynamicArrayType`, `DynamicOptionalType`, `DynamicConvertibleType`, etc.
 It does some type checks in runtime when the type's conformance/inheritance is unknown for the compiler.
 See the `~` prefix operator overloads that are used for types known for the compiler.
 You can add more type checks for types that don't conform to `AnyArgument`, but are allowed to be used as return types.
 `Void` is a good example as it cannot conform to anything or language protocols that cannot be extended to implement `AnyArgument`.
 */
internal prefix func ~ <T>(type: T.Type) -> AnyDynamicType {
  return DynamicType(type)
}

internal prefix func ~ <T>(type: T.Type) -> AnyDynamicType where T: AnyArgument {
  return T.getDynamicType()
}

internal prefix func ~ (type: Void.Type) -> AnyDynamicType {
  return DynamicVoidType.shared
}

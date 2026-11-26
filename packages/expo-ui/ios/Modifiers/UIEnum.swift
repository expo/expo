// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 An enum that only inline modifiers read: a plain `String` raw-value enum.
 The compiler writes `init(rawValue:)`, and `UIEnum` adds no conformance of its own.
 An enum that JavaScript passes or receives, or that a `@Field` uses, stays `Enumerable`.
 */
internal typealias UIEnum = RawRepresentable

extension ModifierParams {
  // Same rules as `DynamicEnumType`: the value must be a String that matches a case.
  @_semantics("optimize.sil.specialize.generic.never")
  private func decodeEnum<T: UIEnum>(_ key: String, _ value: Any?) throws -> T where T.RawValue == String {
    guard let string = value as? String, let result = T(rawValue: string) else {
      throw ModifierFieldException(key)
    }
    return result
  }

  @inline(__always)
  func value<T: UIEnum>(_ key: String, _ fallback: T) throws -> T where T.RawValue == String {
    guard raw.keys.contains(key) else {
      return fallback
    }
    return try decodeEnum(key, raw[key])
  }

  @inline(__always)
  func value<T: UIEnum>(_ key: String, _ fallback: T?) throws -> T? where T.RawValue == String {
    guard raw.keys.contains(key) else {
      return fallback
    }
    let newValue = raw[key]
    if newValue == nil || newValue is NSNull {
      return nil
    }
    return try decodeEnum(key, newValue) as T
  }

  @inline(__always)
  func value<T: UIEnum>(_ key: String, _ fallback: [T]) throws -> [T] where T.RawValue == String {
    guard raw.keys.contains(key) else {
      return fallback
    }
    guard let array = raw[key] as? [Any] else {
      throw ModifierFieldException(key)
    }
    return try array.map { try decodeEnum(key, $0) as T }
  }

  @inline(__always)
  func value<T: UIEnum>(_ key: String, _ fallback: [T]?) throws -> [T]? where T.RawValue == String {
    guard raw.keys.contains(key) else {
      return fallback
    }
    let newValue = raw[key]
    if newValue == nil || newValue is NSNull {
      return nil
    }
    guard let array = newValue as? [Any] else {
      throw ModifierFieldException(key)
    }
    return try array.map { try decodeEnum(key, $0) as T }
  }

  // An `Enumerable` enum is both AnyArgument and RawRepresentable. These more specific
  // overloads keep it on the AnyArgument conversion, as before.
  @inline(__always)
  func value<T: AnyArgument & RawRepresentable>(_ key: String, _ fallback: T) throws -> T where T.RawValue == String {
    var value = fallback
    try readArgument(key, into: &value)
    return value
  }

  @inline(__always)
  func value<T: AnyArgument & RawRepresentable>(_ key: String, _ fallback: T?) throws -> T? where T.RawValue == String {
    var value = fallback
    try readArgument(key, into: &value)
    return value
  }
}

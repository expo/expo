// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 A type with `@Field` members that is only created from a dictionary, such as the params of a modifier.
 Unlike `Record`, it is not converted to or from JavaScript values, so it has none of the JavaScript
 conversion conformances. Use `Record` when JavaScript passes or receives the type.
 */
internal protocol UIRecord {
  init()
}

extension UIRecord {
  typealias Dict = [String: Any]

  // One shared copy for every type, instead of one specialized copy per type.
  @inline(never)
  @_semantics("optimize.sil.specialize.generic.never")
  init(from dict: Dict, appContext: AppContext) throws {
    self.init()
    try updateFields(of: self, withDict: dict, appContext: appContext)
  }
}

extension ModifierParams {
  // Decodes a nested dictionary with the same rules as a `Record` field.
  @_semantics("optimize.sil.specialize.generic.never")
  private func decodeRecord<T: UIRecord>(_ key: String, _ value: Any?) throws -> T {
    guard let dict = value as? [String: Any] else {
      throw ModifierFieldException(key)
    }
    return try T(from: dict, appContext: appContext)
  }

  @inline(__always)
  func value<T: UIRecord>(_ key: String, _ fallback: T) throws -> T {
    guard raw.keys.contains(key) else {
      return fallback
    }
    return try decodeRecord(key, raw[key])
  }

  @inline(__always)
  func value<T: UIRecord>(_ key: String, _ fallback: T?) throws -> T? {
    guard raw.keys.contains(key) else {
      return fallback
    }
    let newValue = raw[key]
    if newValue == nil || newValue is NSNull {
      return nil
    }
    return try decodeRecord(key, newValue) as T
  }

  @inline(__always)
  func value<T: UIRecord>(_ key: String, _ fallback: [T]) throws -> [T] {
    guard raw.keys.contains(key) else {
      return fallback
    }
    guard let array = raw[key] as? [Any] else {
      throw ModifierFieldException(key)
    }
    return try array.map { try decodeRecord(key, $0) as T }
  }

  @inline(__always)
  func value<T: UIRecord>(_ key: String, _ fallback: [T]?) throws -> [T]? {
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
    return try array.map { try decodeRecord(key, $0) as T }
  }
}

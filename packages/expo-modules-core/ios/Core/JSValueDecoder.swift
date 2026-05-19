// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 Decodes `JavaScriptValue`s into `Decodable` Swift values.

 For any property whose static type is known to the dynamic-type registry
 (anything routed via the `~` operator: arrays, dictionaries, optionals,
 `RawRepresentable` enums, `Convertible`s, `JavaScriptValue` and so on),
 the decoder takes the fast path through `cast(jsValue:)`, preserving full
 element-type metadata and picking up `Convertible` coercions for free.

 Only types the registry doesn't recognize (i.e. plain `Decodable` structs and
 classes) fall back to Swift's `Decodable` machinery via `T.init(from: decoder)`.
 */
internal final class JSValueDecoder: Decoder {
  private let appContext: AppContext
  private let runtime: JavaScriptRuntime
  private let value: JavaScriptValue

  /**
   Initializes the decoder with the given JS value and app context.
   Throws if the runtime has been lost.
   */
  convenience init(value: JavaScriptValue, appContext: AppContext) throws {
    try self.init(value: value, appContext: appContext, runtime: appContext.runtime)
  }

  /**
   Initializes the decoder with the given JS value, app context and an explicit runtime.
   Use this when the source JS value lives in a runtime other than the one currently
   held by the app context.
   */
  convenience init(value: JavaScriptValue, appContext: AppContext, runtime: JavaScriptRuntime) {
    self.init(value: value, appContext: appContext, runtime: runtime, codingPath: [])
  }

  fileprivate init(
    value: JavaScriptValue,
    appContext: AppContext,
    runtime: JavaScriptRuntime,
    codingPath: [any CodingKey]
  ) {
    self.value = value
    self.appContext = appContext
    self.runtime = runtime
    self.codingPath = codingPath
  }

  // MARK: - Decoder

  let codingPath: [any CodingKey]
  let userInfo: [CodingUserInfoKey: Any] = [:]

  func container<Key>(keyedBy type: Key.Type) throws -> KeyedDecodingContainer<Key> where Key: CodingKey {
    guard value.isObject() else {
      throw DecodingError.typeMismatch(
        [String: Any].self,
        DecodingError.Context(
          codingPath: codingPath,
          debugDescription: "Expected a JavaScript object to decode keyed container, got \(value.kind.rawValue)"
        )
      )
    }
    let container = JSObjectDecodingContainer<Key>(
      object: value.getObject(),
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath
    )
    return KeyedDecodingContainer(container)
  }

  func unkeyedContainer() throws -> any UnkeyedDecodingContainer {
    guard value.isArray() else {
      throw DecodingError.typeMismatch(
        [Any].self,
        DecodingError.Context(
          codingPath: codingPath,
          debugDescription: "Expected a JavaScript array to decode unkeyed container, got \(value.kind.rawValue)"
        )
      )
    }
    return JSArrayDecodingContainer(
      array: value.getArray(),
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath
    )
  }

  func singleValueContainer() throws -> any SingleValueDecodingContainer {
    return JSValueDecodingContainer(
      value: value,
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath
    )
  }
}

// MARK: - Shared decoding logic

/**
 Decodes a single JS value into a typed Swift value, routing through the
 dynamic-type registry whenever possible and falling back to `Decodable` only
 for plain types.
 */
private func decodeUsingDynamicType<ValueType: Decodable>(
  _ type: ValueType.Type,
  from jsValue: JavaScriptValue,
  appContext: AppContext,
  runtime: JavaScriptRuntime,
  codingPath: [any CodingKey]
) throws -> ValueType {
  let dynamicType = ~ValueType.self

  if !(dynamicType is DynamicCodableType<ValueType>) {
    do {
      let anyValue = try JavaScriptActor.assumeIsolated {
        return try dynamicType.cast(jsValue: jsValue, appContext: appContext)
      }
      guard let typed = anyValue as? ValueType else {
        throw DecodingError.typeMismatch(
          ValueType.self,
          DecodingError.Context(
            codingPath: codingPath,
            debugDescription: "Dynamic type \(dynamicType) produced \(Swift.type(of: anyValue)) which is not \(ValueType.self)"
          )
        )
      }
      return typed
    } catch let error as DecodingError {
      throw error
    } catch {
      throw DecodingError.dataCorrupted(
        DecodingError.Context(
          codingPath: codingPath,
          debugDescription: "Failed to cast JS value to \(ValueType.self)",
          underlyingError: error
        )
      )
    }
  }

  // Plain Decodable type the registry doesn't recognize — recurse via Decodable.
  let decoder = JSValueDecoder(value: jsValue, appContext: appContext, runtime: runtime, codingPath: codingPath)
  return try ValueType(from: decoder)
}

// MARK: - Containers

/**
 Single value container that reads a JS primitive (or unwraps an Optional).
 */
private struct JSValueDecodingContainer: SingleValueDecodingContainer {
  private let appContext: AppContext
  private let runtime: JavaScriptRuntime
  private let value: JavaScriptValue
  let codingPath: [any CodingKey]

  init(value: JavaScriptValue, appContext: AppContext, runtime: JavaScriptRuntime, codingPath: [any CodingKey]) {
    self.value = value
    self.appContext = appContext
    self.runtime = runtime
    self.codingPath = codingPath
  }

  func decodeNil() -> Bool {
    return value.isNull() || value.isUndefined()
  }

  func decode<ValueType: Decodable>(_ type: ValueType.Type) throws -> ValueType {
    return try decodeUsingDynamicType(
      type,
      from: value,
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath
    )
  }
}

/**
 Keyed container that reads from a JS object.

 - Note: This is a `class` (not a `struct`) for the same reason as the encoder's
   keyed container: it holds a non-copyable `JavaScriptObject`. See
   `JSObjectEncodingContainer` for the full rationale.
 */
private final class JSObjectDecodingContainer<Key: CodingKey>: KeyedDecodingContainerProtocol {
  private let appContext: AppContext
  private let runtime: JavaScriptRuntime
  private let object: JavaScriptObject
  let codingPath: [any CodingKey]

  init(object: consuming JavaScriptObject, appContext: AppContext, runtime: JavaScriptRuntime, codingPath: [any CodingKey]) {
    self.object = object
    self.appContext = appContext
    self.runtime = runtime
    self.codingPath = codingPath
  }

  lazy var allKeys: [Key] = object.getPropertyNames().compactMap { Key(stringValue: $0) }

  func contains(_ key: Key) -> Bool {
    return object.hasProperty(key.stringValue)
  }

  func decodeNil(forKey key: Key) throws -> Bool {
    let value = object.getProperty(key.stringValue)
    return value.isNull() || value.isUndefined()
  }

  // JS doesn't meaningfully distinguish "key absent" from "value undefined" at the
  // consumer level — a single `getProperty` fetch returns `undefined` in both cases.
  // Collapse both into `keyNotFound` so the caller gets the more useful error.
  func decode<ValueType: Decodable>(_ type: ValueType.Type, forKey key: Key) throws -> ValueType {
    let jsValue = object.getProperty(key.stringValue)
    if jsValue.isUndefined() {
      throw DecodingError.keyNotFound(
        key,
        DecodingError.Context(
          codingPath: codingPath,
          debugDescription: "No value found for key \(key.stringValue)"
        )
      )
    }
    return try decodeUsingDynamicType(
      type,
      from: jsValue,
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath + [key]
    )
  }

  // Swift's default `decodeIfPresent` calls `contains(key)` and then `decodeNil(forKey:)`;
  // for present-but-null JS keys this works, but it doesn't reach our dynamic-type
  // fast path. Override to make optional decoding consistently route through it.
  // `JavaScriptObject.getProperty` returns `undefined` for missing keys, so a single
  // fetch covers both "absent" and "explicit null/undefined" cases.
  func decodeIfPresent<ValueType: Decodable>(_ type: ValueType.Type, forKey key: Key) throws -> ValueType? {
    let jsValue = object.getProperty(key.stringValue)
    if jsValue.isNull() || jsValue.isUndefined() {
      return nil
    }
    return try decodeUsingDynamicType(
      type,
      from: jsValue,
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath + [key]
    )
  }

  func nestedContainer<NestedKey>(keyedBy keyType: NestedKey.Type, forKey key: Key) throws -> KeyedDecodingContainer<NestedKey> where NestedKey: CodingKey {
    let jsValue = object.getProperty(key.stringValue)
    guard jsValue.isObject() else {
      throw DecodingError.typeMismatch(
        [String: Any].self,
        DecodingError.Context(
          codingPath: codingPath + [key],
          debugDescription: "Expected a JavaScript object for nested keyed container, got \(jsValue.kind.rawValue)"
        )
      )
    }
    let container = JSObjectDecodingContainer<NestedKey>(
      object: jsValue.getObject(),
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath + [key]
    )
    return KeyedDecodingContainer(container)
  }

  func nestedUnkeyedContainer(forKey key: Key) throws -> any UnkeyedDecodingContainer {
    let jsValue = object.getProperty(key.stringValue)
    guard jsValue.isArray() else {
      throw DecodingError.typeMismatch(
        [Any].self,
        DecodingError.Context(
          codingPath: codingPath + [key],
          debugDescription: "Expected a JavaScript array for nested unkeyed container, got \(jsValue.kind.rawValue)"
        )
      )
    }
    return JSArrayDecodingContainer(
      array: jsValue.getArray(),
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath + [key]
    )
  }

  func superDecoder() throws -> any Decoder {
    throw DecodingError.dataCorrupted(
      DecodingError.Context(
        codingPath: codingPath,
        debugDescription: "JSValueDecoder does not support superDecoder()"
      )
    )
  }

  func superDecoder(forKey key: Key) throws -> any Decoder {
    throw DecodingError.dataCorrupted(
      DecodingError.Context(
        codingPath: codingPath + [key],
        debugDescription: "JSValueDecoder does not support superDecoder(forKey:)"
      )
    )
  }
}

/**
 Unkeyed container that reads from a JS array.

 Like `JSObjectDecodingContainer`, this is a `class` so it can hold the
 non-copyable `JavaScriptArray` directly.
 */
private final class JSArrayDecodingContainer: UnkeyedDecodingContainer {
  private let appContext: AppContext
  private let runtime: JavaScriptRuntime
  private let array: JavaScriptArray
  let codingPath: [any CodingKey]
  var currentIndex: Int = 0

  init(array: consuming JavaScriptArray, appContext: AppContext, runtime: JavaScriptRuntime, codingPath: [any CodingKey]) {
    self.array = array
    self.appContext = appContext
    self.runtime = runtime
    self.codingPath = codingPath
  }

  var count: Int? { array.length }
  var isAtEnd: Bool { currentIndex >= array.length }

  func decodeNil() throws -> Bool {
    let jsValue = try nextValue(Any?.self)
    if jsValue.isNull() || jsValue.isUndefined() {
      currentIndex += 1
      return true
    }
    return false
  }

  func decode<ValueType: Decodable>(_ type: ValueType.Type) throws -> ValueType {
    let jsValue = try nextValue(type)
    let key = AnyCodingKey(intValue: currentIndex)
    let decoded = try decodeUsingDynamicType(
      type,
      from: jsValue,
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath + [key]
    )
    currentIndex += 1
    return decoded
  }

  func decodeIfPresent<ValueType: Decodable>(_ type: ValueType.Type) throws -> ValueType? {
    if isAtEnd {
      return nil
    }
    let jsValue = try array.getValue(at: currentIndex)
    if jsValue.isNull() || jsValue.isUndefined() {
      currentIndex += 1
      return nil
    }
    let key = AnyCodingKey(intValue: currentIndex)
    let decoded = try decodeUsingDynamicType(
      type,
      from: jsValue,
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath + [key]
    )
    currentIndex += 1
    return decoded
  }

  func nestedContainer<NestedKey>(keyedBy keyType: NestedKey.Type) throws -> KeyedDecodingContainer<NestedKey> where NestedKey: CodingKey {
    let jsValue = try nextValue(KeyedDecodingContainer<NestedKey>.self)
    let key = AnyCodingKey(intValue: currentIndex)
    guard jsValue.isObject() else {
      throw DecodingError.typeMismatch(
        [String: Any].self,
        DecodingError.Context(
          codingPath: codingPath + [key],
          debugDescription: "Expected a JavaScript object for nested keyed container, got \(jsValue.kind.rawValue)"
        )
      )
    }
    let container = JSObjectDecodingContainer<NestedKey>(
      object: jsValue.getObject(),
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath + [key]
    )
    currentIndex += 1
    return KeyedDecodingContainer(container)
  }

  func nestedUnkeyedContainer() throws -> any UnkeyedDecodingContainer {
    let jsValue = try nextValue((any UnkeyedDecodingContainer).self)
    let key = AnyCodingKey(intValue: currentIndex)
    guard jsValue.isArray() else {
      throw DecodingError.typeMismatch(
        [Any].self,
        DecodingError.Context(
          codingPath: codingPath + [key],
          debugDescription: "Expected a JavaScript array for nested unkeyed container, got \(jsValue.kind.rawValue)"
        )
      )
    }
    let container = JSArrayDecodingContainer(
      array: jsValue.getArray(),
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath + [key]
    )
    currentIndex += 1
    return container
  }

  // Reads the element at `currentIndex`, throwing `valueNotFound` (rather than letting
  // `JavaScriptArray.getValue(at:)` throw its non-`DecodingError` out-of-range error)
  // when the unkeyed container has been exhausted.
  private func nextValue<RequestedType>(_ expected: RequestedType.Type) throws -> JavaScriptValue {
    if isAtEnd {
      throw DecodingError.valueNotFound(
        expected,
        DecodingError.Context(
          codingPath: codingPath + [AnyCodingKey(intValue: currentIndex)],
          debugDescription: "Unkeyed container is at end — no value available at index \(currentIndex)"
        )
      )
    }
    return try array.getValue(at: currentIndex)
  }

  func superDecoder() throws -> any Decoder {
    throw DecodingError.dataCorrupted(
      DecodingError.Context(
        codingPath: codingPath,
        debugDescription: "JSValueDecoder does not support superDecoder()"
      )
    )
  }
}


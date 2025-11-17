// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Encodes `Encodable` objects or values to `JavaScriptValue`. This implementation is incomplete,
 but it supports basic use cases with structs defined by the user and when the default `Encodable` implementation is used.
 */
internal final class JSValueEncoder: Encoder {
  private let runtime: JavaScriptRuntime
  private let valueHolder = JSValueHolder()

  /**
   The result of encoding to `JavaScriptValue`. Use this property after running `encode(to:)` on the encodable.
   */
  var value: JavaScriptValue {
    return valueHolder.value
  }

  /**
   Initializes the encoder with the given runtime in which the value will be created.
   */
  init(runtime: JavaScriptRuntime) {
    self.runtime = runtime
  }

  // MARK: - Encoder

  // We don't use `codingPath` and `userInfo`, but they are required by the protocol.
  let codingPath: [any CodingKey] = []
  let userInfo: [CodingUserInfoKey: Any] = [:]

  /**
   Returns an encoding container appropriate for holding multiple values keyed by the given key type.
   */
  func container<Key>(keyedBy type: Key.Type) -> KeyedEncodingContainer<Key> where Key: CodingKey {
    let container = JSObjectEncodingContainer<Key>(to: valueHolder, runtime: runtime)
    return KeyedEncodingContainer(container)
  }

  /**
   Returns an encoding container appropriate for holding multiple unkeyed values.
   */
  func unkeyedContainer() -> any UnkeyedEncodingContainer {
    return JSArrayEncodingContainer(to: valueHolder, runtime: runtime)
  }

  /**
   Returns an encoding container appropriate for holding a single primitive value, including optionals.
   */
  func singleValueContainer() -> any SingleValueEncodingContainer {
    return JSValueEncodingContainer(to: valueHolder, runtime: runtime)
  }
}

/**
 An object that holds a JS value that could be overriden by the encoding container.
 */
private final class JSValueHolder {
  var value: JavaScriptValue = .undefined
}

/**
 Single value container used to encode primitive values, including optionals.
 */
private struct JSValueEncodingContainer: SingleValueEncodingContainer {
  private weak var runtime: JavaScriptRuntime?
  private let valueHolder: JSValueHolder

  init(to valueHolder: JSValueHolder, runtime: JavaScriptRuntime?) {
    self.runtime = runtime
    self.valueHolder = valueHolder
  }

  // MARK: - SingleValueEncodingContainer

  // Unused, but required by the protocol.
  let codingPath: [any CodingKey] = []

  mutating func encodeNil() throws {
    self.valueHolder.value = .null
  }

  mutating func encode<ValueType: Encodable>(_ value: ValueType) throws {
    guard let runtime else {
      // Do nothing when the runtime is already deallocated
      return
    }
    let jsValue = JavaScriptValue.from(value, runtime: runtime)

    // If the given value couldn't be converted to JavaScriptValue, try to encode it farther.
    // It might be the case when the default implementation of `Encodable` has chosen the single value container
    // for an optional type that should rather use keyed or unkeyed container when unwrapped.
    if jsValue.isUndefined() {
      let encoder = JSValueEncoder(runtime: runtime)
      try value.encode(to: encoder)
      self.valueHolder.value = encoder.value
      return
    }
    self.valueHolder.value = jsValue
  }
}

/**
 Keyed container that encodes to a JavaScript object.
 */
private struct JSObjectEncodingContainer<Key: CodingKey>: KeyedEncodingContainerProtocol {
  private weak var runtime: JavaScriptRuntime?
  private let valueHolder: JSValueHolder
  private var object: JavaScriptObject

  init(to valueHolder: JSValueHolder, runtime: JavaScriptRuntime) {
    let object = runtime.createObject()
    valueHolder.value = JavaScriptValue.from(object, runtime: runtime)

    self.runtime = runtime
    self.object = object
    self.valueHolder = valueHolder
  }

  // MARK: - KeyedEncodingContainerProtocol

  // Unused, but required by the protocol.
  var codingPath: [any CodingKey] = []

  mutating func encodeNil(forKey key: Key) throws {
    object.setProperty(key.stringValue, value: JavaScriptValue.null)
  }

  mutating func encode<ValueType: Encodable>(_ value: ValueType, forKey key: Key) throws {
    guard let runtime else {
      // Do nothing when the runtime is already deallocated
      return
    }
    let encoder = JSValueEncoder(runtime: runtime)
    try value.encode(to: encoder)
    object.setProperty(key.stringValue, value: encoder.value)
  }

  mutating func nestedContainer<NestedKey: CodingKey>(keyedBy keyType: NestedKey.Type, forKey key: Key) -> KeyedEncodingContainer<NestedKey> {
    fatalError("JSValueEncoder does not support nested containers")
  }

  mutating func nestedUnkeyedContainer(forKey key: Key) -> any UnkeyedEncodingContainer {
    fatalError("JSValueEncoder does not support nested containers")
  }

  mutating func superEncoder() -> any Encoder {
    fatalError("superEncoder() is not implemented in JSValueEncoder")
  }

  mutating func superEncoder(forKey key: Key) -> any Encoder {
    return self.superEncoder()
  }
}

/**
 Unkeyed container that encodes values to a JavaScript array.
 */
private struct JSArrayEncodingContainer: UnkeyedEncodingContainer {
  private weak var runtime: JavaScriptRuntime?
  private let valueHolder: JSValueHolder
  private var items: [JavaScriptValue] = []

  init(to valueHolder: JSValueHolder, runtime: JavaScriptRuntime) {
    self.runtime = runtime
    self.valueHolder = valueHolder
  }

  // MARK: - UnkeyedEncodingContainer

  // Unused, but required by the protocol.
  var codingPath: [any CodingKey] = []
  var count: Int = 0

  mutating func encodeNil() throws {
    items.append(.null)
  }

  mutating func encode<ValueType: Encodable>(_ value: ValueType) throws {
    guard let runtime else {
      // Do nothing when the runtime is already deallocated
      return
    }
    let encoder = JSValueEncoder(runtime: runtime)
    try value.encode(to: encoder)

    items.append(encoder.value)
    valueHolder.value = .from(items, runtime: runtime)
  }

  mutating func nestedContainer<NestedKey>(keyedBy keyType: NestedKey.Type) -> KeyedEncodingContainer<NestedKey> where NestedKey : CodingKey {
    fatalError("JSValueEncoder does not support nested containers")
  }

  mutating func nestedUnkeyedContainer() -> any UnkeyedEncodingContainer {
    fatalError("JSValueEncoder does not support nested containers")
  }

  mutating func superEncoder() -> any Encoder {
    fatalError("superEncoder() is not implemented in JSValueEncoder")
  }
}

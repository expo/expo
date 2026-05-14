// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 Encodes `Encodable` values to `JavaScriptValue`.

 For any property whose static type is known to the dynamic-type registry
 (anything routed via the `~` operator: arrays, dictionaries, optionals,
 `RawRepresentable` enums, `Convertible`s, `JavaScriptValue` and so on),
 the encoder takes the fast path through `castToJS`, preserving full
 element-type metadata.

 Only types the registry doesn't recognize (i.e. plain `Encodable` structs and
 classes) fall back to Swift's `Encodable` machinery via `value.encode(to:)`.
 */
internal final class JSValueEncoder: Encoder {
  private let appContext: AppContext
  private let runtime: JavaScriptRuntime
  private let valueHolder: JSValueHolder

  /**
   The result of encoding to `JavaScriptValue`. Use this property after running `encode(to:)` on the encodable.
   */
  var value: JavaScriptValue {
    return valueHolder.value
  }

  /**
   Initializes the encoder with the given app context. Throws if the runtime has been lost.
   */
  convenience init(appContext: AppContext) throws {
    try self.init(appContext: appContext, runtime: appContext.runtime)
  }

  /**
   Initializes the encoder with the given app context and an explicit runtime.
   Use this when produced JS values must live in a runtime other than the
   one currently held by the app context.
   */
  convenience init(appContext: AppContext, runtime: JavaScriptRuntime) {
    self.init(
      appContext: appContext,
      runtime: runtime,
      codingPath: [],
      valueHolder: JSValueHolder()
    )
  }

  fileprivate init(
    appContext: AppContext,
    runtime: JavaScriptRuntime,
    codingPath: [any CodingKey],
    valueHolder: JSValueHolder
  ) {
    self.appContext = appContext
    self.runtime = runtime
    self.codingPath = codingPath
    self.valueHolder = valueHolder
  }

  // MARK: - Encoder

  let codingPath: [any CodingKey]
  let userInfo: [CodingUserInfoKey: Any] = [:]

  func container<Key>(keyedBy type: Key.Type) -> KeyedEncodingContainer<Key> where Key: CodingKey {
    let container = JSObjectEncodingContainer<Key>(
      to: valueHolder,
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath
    )
    return KeyedEncodingContainer(container)
  }

  func unkeyedContainer() -> any UnkeyedEncodingContainer {
    return JSArrayEncodingContainer(
      to: valueHolder,
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath
    )
  }

  func singleValueContainer() -> any SingleValueEncodingContainer {
    return JSValueEncodingContainer(
      to: valueHolder,
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath
    )
  }
}

// MARK: - Shared encoding logic

/**
 Encodes a single value into a `JavaScriptValue`, routing through the dynamic-type
 registry whenever possible and falling back to `Encodable` only for plain types.
 */
private func encodeUsingDynamicType<ValueType: Encodable>(
  _ value: ValueType,
  appContext: AppContext,
  runtime: JavaScriptRuntime,
  codingPath: [any CodingKey]
) throws -> JavaScriptValue {
  let dynamicType = ~ValueType.self

  if !(dynamicType is DynamicEncodableType) {
    return try dynamicType.castToJS(value, appContext: appContext, in: runtime)
  }

  // Plain Encodable type the registry doesn't recognize — recurse via Encodable.
  let holder = JSValueHolder()
  let encoder = JSValueEncoder(
    appContext: appContext,
    runtime: runtime,
    codingPath: codingPath,
    valueHolder: holder
  )
  try value.encode(to: encoder)
  return holder.value
}

// MARK: - Containers

/**
 An object that holds a JS value, mutated by an encoding container as it makes progress.
 */
private final class JSValueHolder {
  var value: JavaScriptValue = .undefined
}

/**
 Single value container used to encode primitive values, including optionals.
 */
private struct JSValueEncodingContainer: SingleValueEncodingContainer {
  private let appContext: AppContext
  private let runtime: JavaScriptRuntime
  private let valueHolder: JSValueHolder
  let codingPath: [any CodingKey]

  init(to valueHolder: JSValueHolder, appContext: AppContext, runtime: JavaScriptRuntime, codingPath: [any CodingKey]) {
    self.valueHolder = valueHolder
    self.appContext = appContext
    self.runtime = runtime
    self.codingPath = codingPath
  }

  mutating func encodeNil() throws {
    valueHolder.value = .null
  }

  mutating func encode<ValueType: Encodable>(_ value: ValueType) throws {
    valueHolder.value = try encodeUsingDynamicType(
      value,
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath
    )
  }
}

/**
 Keyed container that encodes to a JavaScript object.

 - Note: This is a `class` (not a `struct`) because it holds a non-copyable
   `JavaScriptObject`. A struct property of a non-copyable type makes the
   containing struct non-copyable too, which conflicts with
   `KeyedEncodingContainerProtocol`'s expectation of a copyable conformer.
   Using a class sidesteps the constraint via reference semantics.
 */
private final class JSObjectEncodingContainer<Key: CodingKey>: KeyedEncodingContainerProtocol {
  private let appContext: AppContext
  private let runtime: JavaScriptRuntime
  private let valueHolder: JSValueHolder
  private let object: JavaScriptObject
  let codingPath: [any CodingKey]

  init(to valueHolder: JSValueHolder, appContext: AppContext, runtime: JavaScriptRuntime, codingPath: [any CodingKey]) {
    let object = runtime.createObject()
    valueHolder.value = object.asValue()

    self.appContext = appContext
    self.runtime = runtime
    self.valueHolder = valueHolder
    self.object = object
    self.codingPath = codingPath
  }

  func encodeNil(forKey key: Key) throws {
    object.setProperty(key.stringValue, value: JavaScriptValue.null)
  }

  func encode<ValueType: Encodable>(_ value: ValueType, forKey key: Key) throws {
    let encoded = try encodeUsingDynamicType(
      value,
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath + [key]
    )
    object.setProperty(key.stringValue, value: encoded)
  }

  // The default `KeyedEncodingContainerProtocol.encodeIfPresent` does nothing for
  // nil values, which leaves the JS object without the key entirely — so `'label' in obj`
  // returns false and consumers can't distinguish "absent" from "explicitly null".
  // Override every overload (one per primitive plus a generic `Encodable` one) so nil
  // optional fields produce an explicit `null` instead.
  func encodeIfPresent<ValueType: Encodable>(_ value: ValueType?, forKey key: Key) throws {
    if let value {
      try encode(value, forKey: key)
    } else {
      try encodeNil(forKey: key)
    }
  }

  func encodeIfPresent(_ value: Bool?, forKey key: Key) throws { try encodeOptional(value, forKey: key) }
  func encodeIfPresent(_ value: String?, forKey key: Key) throws { try encodeOptional(value, forKey: key) }
  func encodeIfPresent(_ value: Double?, forKey key: Key) throws { try encodeOptional(value, forKey: key) }
  func encodeIfPresent(_ value: Float?, forKey key: Key) throws { try encodeOptional(value, forKey: key) }
  func encodeIfPresent(_ value: Int?, forKey key: Key) throws { try encodeOptional(value, forKey: key) }
  func encodeIfPresent(_ value: Int8?, forKey key: Key) throws { try encodeOptional(value, forKey: key) }
  func encodeIfPresent(_ value: Int16?, forKey key: Key) throws { try encodeOptional(value, forKey: key) }
  func encodeIfPresent(_ value: Int32?, forKey key: Key) throws { try encodeOptional(value, forKey: key) }
  func encodeIfPresent(_ value: Int64?, forKey key: Key) throws { try encodeOptional(value, forKey: key) }
  func encodeIfPresent(_ value: UInt?, forKey key: Key) throws { try encodeOptional(value, forKey: key) }
  func encodeIfPresent(_ value: UInt8?, forKey key: Key) throws { try encodeOptional(value, forKey: key) }
  func encodeIfPresent(_ value: UInt16?, forKey key: Key) throws { try encodeOptional(value, forKey: key) }
  func encodeIfPresent(_ value: UInt32?, forKey key: Key) throws { try encodeOptional(value, forKey: key) }
  func encodeIfPresent(_ value: UInt64?, forKey key: Key) throws { try encodeOptional(value, forKey: key) }

  private func encodeOptional<ValueType: Encodable>(_ value: ValueType?, forKey key: Key) throws {
    if let value {
      try encode(value, forKey: key)
    } else {
      try encodeNil(forKey: key)
    }
  }

  func nestedContainer<NestedKey: CodingKey>(keyedBy keyType: NestedKey.Type, forKey key: Key) -> KeyedEncodingContainer<NestedKey> {
    let holder = JSValueHolder()
    let container = JSObjectEncodingContainer<NestedKey>(
      to: holder,
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath + [key]
    )
    object.setProperty(key.stringValue, value: holder.value)
    return KeyedEncodingContainer(container)
  }

  func nestedUnkeyedContainer(forKey key: Key) -> any UnkeyedEncodingContainer {
    let holder = JSValueHolder()
    let container = JSArrayEncodingContainer(
      to: holder,
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath + [key]
    )
    object.setProperty(key.stringValue, value: holder.value)
    return container
  }

  func superEncoder() -> any Encoder {
    fatalError("JSValueEncoder does not support superEncoder()")
  }

  func superEncoder(forKey key: Key) -> any Encoder {
    fatalError("JSValueEncoder does not support superEncoder(forKey:)")
  }
}

/**
 Unkeyed container that encodes values to a JavaScript array.

 Like `JSObjectEncodingContainer`, this is a `class` so it can hold the
 non-copyable `JavaScriptArray` directly without forcing the container itself
 to be non-copyable.
 */
private final class JSArrayEncodingContainer: UnkeyedEncodingContainer {
  private let appContext: AppContext
  private let runtime: JavaScriptRuntime
  private let valueHolder: JSValueHolder
  private let array: JavaScriptArray
  let codingPath: [any CodingKey]
  var count: Int = 0

  init(to valueHolder: JSValueHolder, appContext: AppContext, runtime: JavaScriptRuntime, codingPath: [any CodingKey]) {
    let array = runtime.createArray()
    valueHolder.value = array.asValue()

    self.appContext = appContext
    self.runtime = runtime
    self.valueHolder = valueHolder
    self.array = array
    self.codingPath = codingPath
  }

  func encodeNil() throws {
    array[count] = JavaScriptValue.null
    count += 1
  }

  func encode<ValueType: Encodable>(_ value: ValueType) throws {
    let encoded = try encodeUsingDynamicType(
      value,
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath + [AnyCodingKey(intValue: count)]
    )
    array[count] = encoded
    count += 1
  }

  func nestedContainer<NestedKey: CodingKey>(keyedBy keyType: NestedKey.Type) -> KeyedEncodingContainer<NestedKey> {
    let holder = JSValueHolder()
    let container = JSObjectEncodingContainer<NestedKey>(
      to: holder,
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath + [AnyCodingKey(intValue: count)]
    )
    array[count] = holder.value
    count += 1
    return KeyedEncodingContainer(container)
  }

  func nestedUnkeyedContainer() -> any UnkeyedEncodingContainer {
    let holder = JSValueHolder()
    let container = JSArrayEncodingContainer(
      to: holder,
      appContext: appContext,
      runtime: runtime,
      codingPath: codingPath + [AnyCodingKey(intValue: count)]
    )
    array[count] = holder.value
    count += 1
    return container
  }

  func superEncoder() -> any Encoder {
    fatalError("JSValueEncoder does not support superEncoder()")
  }
}

// MARK: - Helpers

/**
 A coding key carrying just a string and an integer index. Used to extend
 `codingPath` with array indices in the unkeyed container, since unkeyed
 containers have no associated `Key` type to draw from.
 */
private struct AnyCodingKey: CodingKey {
  let stringValue: String
  let intValue: Int?

  init(stringValue: String) {
    self.stringValue = stringValue
    self.intValue = Int(stringValue)
  }

  init(intValue: Int) {
    self.stringValue = String(intValue)
    self.intValue = intValue
  }
}

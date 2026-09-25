// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation

// Conversions for free-form values: `Any`, `[Any]`, `[String: Any]`, and types nested from them.
//
// `Any` can't conform to `JavaScriptDecodable`/`JavaScriptEncodable` (it isn't a nominal type), and
// the container conformances require their elements to conform, so none of these types have a
// `decode`/`encode` of their own. These static methods fill that gap. The three common shapes each
// have a dedicated decode and encode pair that reads or writes the container directly. Any other
// shape that holds `Any` (`[[Any]]`, `[String: [Any]]?`, …) goes through the generic
// `decodeAny(_:as:in:)` and `encodeAny(_:in:)`, which convert the whole value and cast it.
//
// Decoding turns numbers into `Double`, drops `undefined` object properties, and turns `null` and
// `undefined` into `nil` boxed in `Any`, so a decoded value casts to optional types at any depth.
// It differs from the deprecated `getAny()` in two ways: `getAny()` uses `NSNull` for `null`, and it
// silently turns values it can't represent into `NSNull`. Here, a bigint becomes `Int64` (throwing
// when it doesn't fit), and a function or symbol anywhere in the value throws `TypeError`.

extension JavaScriptValue {
  // MARK: - Decoding

  /// Decodes a JavaScript value into a free-form native value: `Bool`, `Double`, `String`, `Int64`
  /// (from a bigint), `[Any]`, `[String: Any]`, or `nil` (boxed in `Any`) for `null` and `undefined`.
  ///
  /// Throws `TypeError` for a function or symbol anywhere in the value, and `BigIntConversionError`
  /// for a bigint outside the `Int64` range.
  @JavaScriptActor
  public static func decodeAny(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Any
  {
    if value.isString() {
      return value.getString()
    }
    if value.isNumber() {
      return value.getDouble()
    }
    if value.isBool() {
      return value.getBool()
    }
    if value.isObject() {
      return try freeFormValue(ofObject: value.getObject(), in: runtime)
    }
    if value.isNull() || value.isUndefined() {
      return Optional<Any>.none as Any
    }
    if value.isBigInt() {
      return try value.getBigInt().asInt64()
    }
    throw TypeError(type: Any.self, reason: unrepresentableValueReason)
  }

  /// Decodes a borrowed JavaScript value into a free-form native value. See ``decodeAny(_:in:)``.
  @JavaScriptActor
  public static func decodeAny(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime)
    throws -> Any
  {
    if value.isString() {
      return value.getString()
    }
    if value.isNumber() {
      return value.getDouble()
    }
    if value.isBool() {
      return value.getBool()
    }
    if value.isObject() {
      return try freeFormValue(ofObject: value.getObject(in: copy runtime), in: runtime)
    }
    if value.isNull() || value.isUndefined() {
      return Optional<Any>.none as Any
    }
    if value.isBigInt() {
      // The borrowed value has no bigint accessor, so this rare case goes through an owning copy.
      return try value.copied(in: copy runtime).getBigInt().asInt64()
    }
    throw TypeError(type: Any.self, reason: unrepresentableValueReason)
  }

  /// Decodes a JavaScript array into an array of free-form native values. A value that isn't an
  /// array is wrapped in a single-element array, like `Array.decode` does.
  @JavaScriptActor
  public static func decodeAnyArray(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime)
    throws -> [Any]
  {
    guard value.isArray() else {
      return [try decodeAny(value, in: runtime)]
    }
    return try freeFormElements(of: value.getArray(), in: runtime)
  }

  /// Decodes a borrowed JavaScript array into an array of free-form native values. See
  /// ``decodeAnyArray(_:in:)``.
  @JavaScriptActor
  public static func decodeAnyArray(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime)
    throws -> [Any]
  {
    guard value.isObject() else {
      return [try decodeAny(value, in: runtime)]
    }
    let object = value.getObject(in: copy runtime)
    guard object.isArray() else {
      return [try freeFormValue(ofObject: object, in: runtime)]
    }
    return try freeFormElements(of: object.getArray(), in: runtime)
  }

  /// Decodes a JavaScript object into a string-keyed dictionary of free-form native values. Throws
  /// `TypeError` if the value isn't an object.
  @JavaScriptActor
  public static func decodeAnyDictionary(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime)
    throws -> [String: Any]
  {
    return try freeFormProperties(of: value.asObject(), in: runtime)
  }

  /// Decodes a borrowed JavaScript object into a string-keyed dictionary of free-form native values.
  /// See ``decodeAnyDictionary(_:in:)``.
  @JavaScriptActor
  public static func decodeAnyDictionary(
    _ value: borrowing JavaScriptUnownedValue,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> [String: Any] {
    return try freeFormProperties(of: value.asObject(in: copy runtime), in: runtime)
  }

  /// Decodes a JavaScript value into any type built from free-form values, such as `[[Any]]` or
  /// `[String: [Any]]?`. The value is decoded with ``decodeAny(_:in:)`` and then
  /// cast to `type`. A `null` or `undefined` at any depth decodes as `nil`, so it fits an optional
  /// in `type` at that position (`[String: [Any]?]` accepts `{ a: null }`).
  ///
  /// Throws `TypeError` if the decoded value can't be cast to `type`. Prefer ``decodeAny(_:in:)``,
  /// ``decodeAnyArray(_:in:)`` or ``decodeAnyDictionary(_:in:)`` for the types they cover, because
  /// they don't need the cast.
  @JavaScriptActor
  public static func decodeAny<T>(
    _ value: borrowing JavaScriptValue,
    as type: T.Type,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> T {
    guard let result = try decodeAny(value, in: runtime) as? T else {
      throw TypeError(type: T.self)
    }
    return result
  }

  // MARK: - Encoding

  /// Encodes a free-form native value into a JavaScript value.
  ///
  /// Supports strings, numbers (including `NSNumber`), booleans, `nil` and `NSNull` (encoded as
  /// `null`), `[Any]` and `[String: Any]` with supported elements, and any `JavaScriptEncodable` or
  /// `JavaScriptRepresentable` value. Throws `EncodingError` for any other value.
  @JavaScriptActor
  public static func encodeAny(_ value: Any, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    // Strings and the native number and boolean types are the most common leaf values, so they're
    // checked first, before the slower protocol casts, and each converts through its own `encode` (so
    // an `Int` outside the safe-integer range throws, as `Int.encode` does). The number and boolean
    // checks compare the exact type rather than casting, since an `NSNumber` casts to both `Bool` and
    // `Double` and has to be told apart below.
    if let string = value as? String {
      return try String.encode(string, in: runtime)
    }
    let valueType = type(of: value)
    if valueType == Double.self {
      return try Double.encode(value as! Double, in: runtime)
    }
    if valueType == Bool.self {
      return try Bool.encode(value as! Bool, in: runtime)
    }
    if valueType == Int.self {
      return try Int.encode(value as! Int, in: runtime)
    }
    if let dictionary = value as? [String: Any] {
      return try encodeAnyDictionary(dictionary, in: runtime)
    }
    if let array = value as? [Any] {
      return try encodeAnyArray(array, in: runtime)
    }
    if value is NSNull {
      return .null
    }
    if let optional = value as? any FreeFormOptional {
      guard let wrapped = optional.freeFormWrappedValue else {
        return .null
      }
      return try encodeAny(wrapped, in: runtime)
    }
    if let encodable = value as? any JavaScriptEncodable {
      return try encode(opening: encodable, in: runtime)
    }
    if let number = value as? NSNumber {
      if CFGetTypeID(number) == CFBooleanGetTypeID() {
        return number.boolValue ? .true() : .false()
      }
      return .number(number.doubleValue)
    }
    if let representable = value as? any JavaScriptRepresentable {
      return representable.toJavaScriptValue(in: copy runtime)
    }
    throw EncodingError(valueType: valueType)
  }

  /// Encodes an array of free-form native values into a JavaScript array. Each element is encoded
  /// with ``encodeAny(_:in:)``.
  @JavaScriptActor
  public static func encodeAnyArray(_ value: [Any], in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    let array = runtime.createArray(length: value.count)
    for (index, element) in value.enumerated() {
      try array.set(value: encodeAny(element, in: runtime), at: index)
    }
    return array.asValue()
  }

  /// Encodes a string-keyed dictionary of free-form native values into a JavaScript object. Each
  /// value is encoded with ``encodeAny(_:in:)``.
  @JavaScriptActor
  public static func encodeAnyDictionary(_ value: [String: Any], in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    let object = runtime.createObject()
    for (key, element) in value {
      object.setProperty(key, value: try encodeAny(element, in: runtime))
    }
    return object.asValue()
  }

  // MARK: - Helpers

  @JavaScriptActor
  private static func freeFormValue(
    ofObject object: borrowing JavaScriptObject,
    in runtime: borrowing JavaScriptRuntime
  )
    throws -> Any
  {
    if object.isArray() {
      return try freeFormElements(of: object.getArray(), in: runtime)
    }
    if object.isFunction() {
      throw TypeError(type: Any.self, reason: unrepresentableValueReason)
    }
    return try freeFormProperties(of: object, in: runtime)
  }

  @JavaScriptActor
  private static func freeFormElements(of array: borrowing JavaScriptArray, in runtime: borrowing JavaScriptRuntime)
    throws -> [Any]
  {
    return try array.map { element in
      return try decodeAny(element, in: runtime)
    }
  }

  @JavaScriptActor
  private static func freeFormProperties(of object: borrowing JavaScriptObject, in runtime: borrowing JavaScriptRuntime)
    throws -> [String: Any]
  {
    let keys = object.getPropertyNames()
    var result = [String: Any](minimumCapacity: keys.count)
    for key in keys {
      let property = object.getProperty(key)
      if property.isUndefined() {
        continue
      }
      result[key] = try decodeAny(property, in: runtime)
    }
    return result
  }

  /// Opens the existential so the conforming type's own `encode` runs.
  @JavaScriptActor
  private static func encode<Value: JavaScriptEncodable>(
    opening value: Value,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> JavaScriptValue {
    return try Value.encode(value, in: runtime)
  }
}

// MARK: - Errors

/// The `TypeError` reason for a JavaScript value that has no free-form native form.
private let unrepresentableValueReason =
  "Cannot convert a JavaScript function or symbol to a native value, because neither has a native representation. Remove it from the value before passing it to native code, or declare the native type as JavaScriptValue to receive it unconverted."

extension JavaScriptValue {
  /// Thrown by ``JavaScriptValue/encodeAny(_:in:)`` for a value it can't convert to JavaScript.
  public struct EncodingError: Error, CustomStringConvertible {
    let valueType: Any.Type

    public var description: String {
      return
        "Cannot convert a value of type '\(valueType)' to a JavaScript value, because it isn't a string, number, boolean, null, array, dictionary, or a JavaScriptEncodable value. Convert it to one of these types first, or make '\(valueType)' conform to JavaScriptEncodable."
    }
  }
}

// MARK: - Optional support

/// Lets `encodeAny` unwrap an `Optional` found inside `Any`, whose wrapped type isn't known statically.
private protocol FreeFormOptional {
  var freeFormWrappedValue: Any? { get }
}

extension Optional: FreeFormOptional {
  var freeFormWrappedValue: Any? {
    return self.map { $0 as Any }
  }
}

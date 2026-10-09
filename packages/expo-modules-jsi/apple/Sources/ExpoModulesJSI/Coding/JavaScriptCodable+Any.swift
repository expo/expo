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
// A `Date` decodes as `Date`, a `Set` as an array of its elements and a `Map` with string keys as a
// dictionary. It differs from the deprecated `getAny()` in two ways: `getAny()` uses `NSNull` for
// `null`, and it silently turns values it can't represent into `NSNull`. Here, a bigint becomes
// `Int64` (throwing when it doesn't fit), and a function, symbol, typed array, `ArrayBuffer`,
// `DataView`, `WeakMap`, `WeakSet` or `Map` with a non-string key anywhere in the value throws
// `TypeError`, as does a value nested deeper than `maxFreeFormDepth` (usually a cycle). Any other
// object decodes from its enumerable own properties only, so data it keeps elsewhere is not
// decoded: an `Error` loses its `message` and `stack`, and a class instance loses values it exposes
// through getters.

extension JavaScriptValue {
  // MARK: - Decoding

  /// Decodes a JavaScript value into a free-form native value: `Bool`, `Double`, `String`, `Int64`
  /// (from a bigint), `Date`, `[Any]`, `[String: Any]`, or `nil` (boxed in `Any`) for `null` and
  /// `undefined`. A `Set` decodes as an array of its elements and a `Map` with string keys as a
  /// dictionary. Any other object decodes from its enumerable own properties only, so an `Error`, for
  /// example, decodes without its `message` and `stack`.
  ///
  /// Throws `TypeError` for a function, symbol, typed array, `ArrayBuffer`, `DataView`, `WeakMap`,
  /// `WeakSet` or `Map` with a non-string key anywhere in the value, or for a value nested more than
  /// 64 levels deep (such as one that contains itself). The error names the path to the failing value.
  /// Throws `BigIntConversionError` for a bigint outside the `Int64` range.
  @JavaScriptActor
  public static func decodeAny(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Any
  {
    return try freeFormValue(of: value, depth: 0, in: runtime)
  }

  /// Decodes a borrowed JavaScript value into a free-form native value. See ``decodeAny(_:in:)``.
  @JavaScriptActor
  public static func decodeAny(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime)
    throws -> Any
  {
    return try freeFormValue(of: value, depth: 0, in: runtime)
  }

  /// Decodes a JavaScript array into an array of free-form native values. A `Set` decodes as an array
  /// of its elements, and any other value that isn't an array is wrapped in a single-element array,
  /// like `Array.decode` does.
  @JavaScriptActor
  public static func decodeAnyArray(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime)
    throws -> [Any]
  {
    guard value.isArray() else {
      return wrappingInArray(try freeFormValue(of: value, depth: 0, in: runtime))
    }
    return try freeFormElements(of: value.getArray(), depth: 0, in: runtime)
  }

  /// Decodes a borrowed JavaScript array into an array of free-form native values. See
  /// ``decodeAnyArray(_:in:)``.
  @JavaScriptActor
  public static func decodeAnyArray(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime)
    throws -> [Any]
  {
    guard value.isObject() else {
      return [try freeFormValue(of: value, depth: 0, in: runtime)]
    }
    let object = value.getObject(in: copy runtime)
    guard object.isArray() else {
      return wrappingInArray(try freeFormValue(ofObject: object, depth: 0, in: runtime))
    }
    return try freeFormElements(of: object.getArray(), depth: 0, in: runtime)
  }

  /// Decodes a JavaScript object into a string-keyed dictionary of free-form native values, with the
  /// same rules as a nested object in ``decodeAny(_:in:)`` (so a `Map` with string keys converts).
  /// Throws `TypeError` if the value doesn't decode as a dictionary, such as a primitive, an array, a
  /// `Date`, a `Set` or a function, or if anything inside it can't be decoded.
  @JavaScriptActor
  public static func decodeAnyDictionary(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime)
    throws -> [String: Any]
  {
    return try freeFormDictionary(of: value.asObject(), in: runtime)
  }

  /// Decodes a borrowed JavaScript object into a string-keyed dictionary of free-form native values.
  /// See ``decodeAnyDictionary(_:in:)``.
  @JavaScriptActor
  public static func decodeAnyDictionary(
    _ value: borrowing JavaScriptUnownedValue,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> [String: Any] {
    return try freeFormDictionary(of: value.asObject(in: copy runtime), in: runtime)
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
      throw TypeError(type: T.self, reason: castFailureReason(for: T.self))
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
    of value: borrowing JavaScriptValue,
    depth: Int,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> Any {
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
      return try freeFormValue(ofObject: value.getObject(), depth: depth, in: runtime)
    }
    if value.isNull() || value.isUndefined() {
      return Optional<Any>.none as Any
    }
    if value.isBigInt() {
      return try value.getBigInt().asInt64()
    }
    throw TypeError(type: Any.self, reason: unrepresentableValueReason)
  }

  @JavaScriptActor
  private static func freeFormValue(
    of value: borrowing JavaScriptUnownedValue,
    depth: Int,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> Any {
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
      return try freeFormValue(ofObject: value.getObject(in: copy runtime), depth: depth, in: runtime)
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

  @JavaScriptActor
  private static func freeFormValue(
    ofObject object: borrowing JavaScriptObject,
    depth: Int,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> Any {
    if object.isArray() {
      return try freeFormElements(of: object.getArray(), depth: depth, in: runtime)
    }
    if object.isFunction() {
      throw TypeError(type: Any.self, reason: unrepresentableValueReason)
    }
    try rejectBinaryData(object)
    let keys = object.getPropertyNames()
    if keys.isEmpty {
      // A `Date`, `Set`, `Map`, `WeakMap`, `WeakSet` or `DataView` has no enumerable properties, so only
      // an object without any can be one. This keeps the global lookup and `instanceof` walk of `is(_:)`
      // off objects that have properties.
      let value = object.asValue()
      if value.is("Date") {
        return try Date.decode(value, in: runtime)
      }
      if value.is("Set") {
        // A `Set` has no native free-form counterpart (a Swift `Set` needs hashable elements), so it
        // decodes as an array of its elements, in insertion order.
        let elements = try runtime.global()
          .getPropertyAsObject("Array")
          .getPropertyAsFunction("from")
          .call(arguments: value)
        return try freeFormElements(of: elements.asArray(), depth: depth, in: runtime)
      }
      if value.is("Map") {
        // A `Map` keeps its entries outside its properties, so it's read through its `[key, value]`
        // pairs. Only string keys have a dictionary counterpart; any other key throws.
        let entries = try runtime.global()
          .getPropertyAsObject("Array")
          .getPropertyAsFunction("from")
          .call(arguments: value)
        return try freeFormMapEntries(of: entries.asArray(), depth: depth, in: runtime)
      }
      if value.is("WeakMap") || value.is("WeakSet") {
        throw TypeError(type: Any.self, reason: weakCollectionReason)
      }
      if value.is("DataView") {
        throw TypeError(type: Any.self, reason: binaryDataReason)
      }
    }
    return try freeFormProperties(of: object, keys: keys, depth: depth, in: runtime)
  }

  /// Decodes a top-level object exactly as it would decode nested inside a value, then requires a
  /// dictionary, so a top-level `Map` converts and a function, `Date`, `Set` or array throws, just as
  /// through `decodeAny(_:as: [String: Any].self)`.
  @JavaScriptActor
  private static func freeFormDictionary(
    of object: borrowing JavaScriptObject,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> [String: Any] {
    guard let dictionary = try freeFormValue(ofObject: object, depth: 0, in: runtime) as? [String: Any] else {
      throw TypeError(type: [String: Any].self, reason: castFailureReason(for: [String: Any].self))
    }
    return dictionary
  }

  @JavaScriptActor
  private static func freeFormElements(
    of array: borrowing JavaScriptArray,
    depth: Int,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> [Any] {
    try checkDepth(depth)
    var index = 0
    return try array.map { element in
      defer {
        index += 1
      }
      do {
        return try freeFormValue(of: element, depth: depth + 1, in: runtime)
      } catch let error as TypeError {
        throw error.prependingPath("[\(index)]")
      }
    }
  }

  @JavaScriptActor
  private static func freeFormProperties(
    of object: borrowing JavaScriptObject,
    keys: [String],
    depth: Int,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> [String: Any] {
    try checkDepth(depth)
    var result = [String: Any](minimumCapacity: keys.count)
    for key in keys {
      let property = object.getProperty(key)
      if property.isUndefined() {
        continue
      }
      do {
        result[key] = try freeFormValue(of: property, depth: depth + 1, in: runtime)
      } catch let error as TypeError {
        throw error.prependingPath(".\(key)")
      }
    }
    return result
  }

  /// Wraps a decoded non-array value in a single-element array, unless it already is an array, which
  /// only a `Set` decodes to. Wrapping a `Set` would add a level that the generic path doesn't.
  private static func wrappingInArray(_ decoded: Any) -> [Any] {
    if let elements = decoded as? [Any] {
      return elements
    }
    return [decoded]
  }

  /// Decodes the `[key, value]` pairs of a `Map` into a dictionary. Throws for a key that isn't a
  /// string, since a dictionary key would have to be a string the entry doesn't have.
  @JavaScriptActor
  private static func freeFormMapEntries(
    of entries: borrowing JavaScriptArray,
    depth: Int,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> [String: Any] {
    try checkDepth(depth)
    var result = [String: Any](minimumCapacity: entries.length)
    for index in 0..<entries.length {
      let entry = try entries.getValue(at: index).asArray()
      let key = try entry.getValue(at: 0)
      guard key.isString() else {
        throw TypeError(type: Any.self, reason: nonStringMapKeyReason)
      }
      let name = key.getString()
      let value = try entry.getValue(at: 1)
      // An `undefined` value means "absent", as it does for an object property.
      if value.isUndefined() {
        continue
      }
      do {
        result[name] = try freeFormValue(of: value, depth: depth + 1, in: runtime)
      } catch let error as TypeError {
        throw error.prependingPath(".\(name)")
      }
    }
    return result
  }

  /// Throws for a typed array or `ArrayBuffer`, whose bytes would otherwise decode as a dictionary
  /// keyed by index, or as an empty one.
  @JavaScriptActor
  private static func rejectBinaryData(_ object: borrowing JavaScriptObject) throws {
    if object.isTypedArray() || object.isArrayBuffer() {
      throw TypeError(type: Any.self, reason: binaryDataReason)
    }
  }

  /// Throws once a value is nested deeper than `maxFreeFormDepth`, which stops a cycle from
  /// recursing until the stack overflows.
  private static func checkDepth(_ depth: Int) throws {
    if depth >= maxFreeFormDepth {
      throw TypeError(type: Any.self, reason: nestingTooDeepReason)
    }
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

/// The deepest nesting of arrays and objects that free-form decoding accepts.
private let maxFreeFormDepth = 64

/// The `TypeError` reason for a JavaScript value that has no free-form native form.
private let unrepresentableValueReason =
  "Cannot convert a JavaScript function or symbol to a native value, because neither has a native representation. Remove it from the value before passing it to native code, or declare the native type as JavaScriptValue to receive it unconverted."

/// The `TypeError` reason for a typed array, `ArrayBuffer` or `DataView` inside a free-form value.
private let binaryDataReason =
  "Cannot convert a typed array, ArrayBuffer or DataView to a free-form native value, because free-form values hold only primitives, plain objects, arrays and dates. Convert it to an array first (for example, with Array.from), or declare the native type as JavaScriptValue to receive it unconverted."

/// The `TypeError` reason for a `WeakMap` or `WeakSet` inside a free-form value.
private let weakCollectionReason =
  "Cannot convert a WeakMap or WeakSet to a native value, because JavaScript doesn't allow reading their entries. Pass a Map or Set instead, or declare the native type as JavaScriptValue to receive it unconverted."

/// The `TypeError` reason for a `Map` with a key that isn't a string.
private let nonStringMapKeyReason =
  "Cannot convert a Map with a key that isn't a string to a native value, because it decodes as a dictionary, whose keys are strings. Use only string keys, convert the Map to an array of entries first (for example, with Array.from), or declare the native type as JavaScriptValue to receive it unconverted."

/// The `TypeError` reason for a value nested deeper than `maxFreeFormDepth`.
private let nestingTooDeepReason =
  "Cannot convert a JavaScript value nested more than \(maxFreeFormDepth) levels deep to a native value, most likely because it contains a reference to itself (a cycle). Remove the cycle before passing the value to native code, or declare the native type as JavaScriptValue to receive it unconverted."

/// The `TypeError` reason for a decoded free-form value that doesn't cast to the requested type.
private func castFailureReason(for type: Any.Type) -> String {
  return
    "Cannot convert the JavaScript value to '\(type)', because the decoded value has a different shape. Free-form decoding produces only Bool, Double (for every number), String, Int64, Date, [Any], [String: Any] (object keys are always String) and nil. Declare the type in terms of these, for example [String: Any] rather than [Int: Any], or pass a value of the expected shape."
}

extension JavaScriptValue.TypeError {
  /// Returns the error with `component` (such as `.key` or `[2]`) added to the front of its path, as
  /// the error passes up through each container on the way out.
  fileprivate func prependingPath(_ component: String) -> Self {
    var error = self
    error.path = component + path
    return error
  }
}

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

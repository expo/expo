// Copyright 2025-present 650 Industries. All rights reserved.

// `JavaScriptCodable` conformances for the standard container and wrapper types (`Array`,
// `Optional`, `Dictionary`), each recursing statically into its element/wrapped type's conversion.
//
// The decodable and encodable halves are separate conditional conformances, each gated only on the
// half it needs. A type conforming to both still gets both halves, but an encode-only element type
// (e.g. `Task`, which has no `decode`) can still be carried through a container's encode.

// MARK: - Array

extension Array: JavaScriptDecodable where Element: JavaScriptDecodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> [Element]
  {
    // A non-array value is "arrayized" into a single-element array, so a caller that passes a
    // scalar where an array is expected still works.
    guard value.isArray() else {
      return [try Element.decode(value, in: runtime)]
    }
    // `map` reads the length once and uses the unchecked element accessor, avoiding a
    // per-element weak-runtime load and bounds check on this hot path.
    return try value.getArray().map { element in
      return try Element.decode(element, in: runtime)
    }
  }
}

extension Array: JavaScriptEncodable where Element: JavaScriptEncodable {
  @JavaScriptActor
  @inlinable
  public static func encode(_ value: [Element], in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    let jsArray = runtime.createArray(length: value.count)
    for (index, element) in value.enumerated() {
      try jsArray.set(value: Element.encode(element, in: runtime), at: index)
    }
    return jsArray.asValue()
  }
}

// MARK: - Optional

extension Optional: JavaScriptDecodable where Wrapped: JavaScriptDecodable {
  // Optional copies nothing itself, so it overrides the zero-copy overload too and forwards the
  // borrowed value straight through — a wrapped primitive argument stays fully zero-copy.
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Wrapped?
  {
    if value.isNull() || value.isUndefined() {
      return .none
    }
    return try Wrapped.decode(value, in: runtime)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> Wrapped?
  {
    if value.isNull() || value.isUndefined() {
      return .none
    }
    return try Wrapped.decode(value, in: runtime)
  }
}

extension Optional: JavaScriptEncodable where Wrapped: JavaScriptEncodable {
  @JavaScriptActor
  @inlinable
  public static func encode(_ value: Wrapped?, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    guard let value else {
      // `nil` maps to `null`; mapping to `undefined` is the job of `ValueOrUndefined`.
      return .null
    }
    return try Wrapped.encode(value, in: runtime)
  }
}

// MARK: - Dictionary

extension Dictionary: JavaScriptDecodable where Key == String, Value: JavaScriptDecodable {
  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> [String: Value]
  {
    let object = try value.asObject()
    let keys = object.getPropertyNames()
    var result = [String: Value](minimumCapacity: keys.count)
    for key in keys {
      let property = object.getProperty(key)
      // Treat an `undefined`-valued property as an absent entry. Without this a non-optional
      // `Value` would reject an object that simply omits the property as `undefined`.
      if property.isUndefined() {
        continue
      }
      result[key] = try Value.decode(property, in: runtime)
    }
    return result
  }
}

extension Dictionary: JavaScriptEncodable where Key == String, Value: JavaScriptEncodable {
  @JavaScriptActor
  @inlinable
  public static func encode(_ value: [String: Value], in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    let object = runtime.createObject()
    for (key, element) in value {
      object.setProperty(key, value: try Value.encode(element, in: runtime))
    }
    return object.asValue()
  }
}

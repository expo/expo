// Copyright 2025-present 650 Industries. All rights reserved.

// `JavaScriptCodable` conformances for the standard container and wrapper types (`Array`,
// `Optional`, `Dictionary`), each recursing statically into its element/wrapped type's conversion.
//
// The decodable and encodable halves are separate conditional conformances, each gated only on the
// half it needs. A type conforming to both still gets both halves, but an encode-only element type
// (e.g. `Task`, which has no `decode`) can still be carried through a container's encode.

// MARK: - Array

extension Array: JavaScriptDecodable where Element: JavaScriptDecodable {
  // A non-array value is decoded as a single-element array, so it's accepted when the element is.
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return Element.decodableKinds.union(.object)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> [Element]
  {
    // Forwards to the unowned overload, which holds the implementation.
    return try value.withUnownedValue(in: runtime) { unownedValue in
      return try decode(unownedValue, in: runtime)
    }
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> [Element]
  {
    // A non-array value is "arrayized" into a single-element array, so a caller that passes a
    // scalar where an array is expected still works.
    guard value.isArray() else {
      return [try Element.decode(value, in: runtime)]
    }
    // Each element is lent out unowned, so it's decoded without a `JavaScriptValue` per element.
    return try value.getArray(in: runtime).mapUnowned { element in
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
    // Each element is encoded into its slot in the array's chunk, with no type checks: element types that
    // can skip the intermediate `JavaScriptValue` override `encode(_:into:in:)`.
    return try runtime.createArray(count: value.count) { (index: Int, slot: borrowing JavaScriptValue.Slot) in
      try Element.encode(value[index], into: slot, in: runtime)
    }
  }

  @JavaScriptActor
  @inlinable
  public static func encode(
    _ value: [Element],
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    // The array is moved into the slot, so an array nested in another array, or set as a property,
    // never becomes a `JavaScriptValue`.
    try runtime.createArray(count: value.count, into: slot) {
      (index: Int, elementSlot: borrowing JavaScriptValue.Slot) in
      try Element.encode(value[index], into: elementSlot, in: runtime)
    }
  }
}

// MARK: - Optional

extension Optional: JavaScriptDecodable where Wrapped: JavaScriptDecodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return Wrapped.decodableKinds.union([.null, .undefined])
  }

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
      return .null()
    }
    return try Wrapped.encode(value, in: runtime)
  }

  @JavaScriptActor
  @inlinable
  public static func encode(
    _ value: Wrapped?,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    guard let value else {
      slot.emplaceNull()
      return
    }
    try Wrapped.encode(value, into: slot, in: runtime)
  }
}

// MARK: - Dictionary

extension Dictionary: JavaScriptDecodable where Key == String, Value: JavaScriptDecodable {
  @inlinable
  public static var decodableKinds: JavaScriptValueKinds {
    return .object
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> [String: Value]
  {
    // Forwards to the unowned overload, which holds the implementation.
    return try value.withUnownedValue(in: runtime) { unownedValue in
      return try decode(unownedValue, in: runtime)
    }
  }

  @JavaScriptActor
  @inlinable
  public static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> [String: Value]
  {
    // Reads the object straight from the borrowed value and lends each property out unowned, so it's
    // decoded without a `JavaScriptValue` per property.
    let object = try value.asObject(in: runtime)
    let keys = object.getPropertyNames()
    var result = [String: Value](minimumCapacity: keys.count)
    for key in keys {
      let decoded: Value? = try object.withUnownedProperty(key) { property in
        // Treat an `undefined`-valued property as an absent entry. Without this a non-optional
        // `Value` would reject an object that simply omits the property as `undefined`.
        return property.isUndefined() ? nil : try Value.decode(property, in: runtime)
      }
      if let decoded {
        result[key] = decoded
      }
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
      try object.setProperty(key, encoding: element)
    }
    return object.takeValue()
  }

  @JavaScriptActor
  @inlinable
  public static func encode(
    _ value: [String: Value],
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    let object = runtime.createObject()
    for (key, element) in value {
      try object.setProperty(key, encoding: element)
    }
    slot.emplace(object)
  }
}

// MARK: - Containers that hold tuples

// An array, optional or dictionary whose element holds a tuple can't conform, since the tuple can't. The
// macros convert it through these methods, which convert each element with a closure, like the tuple
// methods in `JavaScriptCodable+Tuple.swift`, and otherwise behave like the conformances above.

extension JavaScriptValue {
  /// Decodes an array, converting each element with `element`. Like `Array.decode`, a value that isn't
  /// an array decodes as a single-element array.
  @JavaScriptActor
  public static func decodeArray<Element>(
    _ value: borrowing JavaScriptUnownedValue,
    in runtime: borrowing JavaScriptRuntime,
    element: ElementDecoder<Element>
  ) throws -> [Element] {
    guard value.isArray() else {
      return [try element(value, runtime)]
    }
    return try value.getArray(in: runtime).mapUnowned { value in
      return try element(value, runtime)
    }
  }

  /// Encodes an array into `slot`, converting each element with `element`.
  @JavaScriptActor
  public static func encodeArray<Element>(
    _ value: [Element],
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime,
    element: ElementEncoder<Element>
  ) throws {
    try runtime.createArray(count: value.count, into: slot) {
      (index: Int, elementSlot: borrowing JavaScriptValue.Slot) in
      try element(value[index], elementSlot, runtime)
    }
  }

  /// Decodes an optional, mapping `undefined` and `null` to `nil` and converting any other value with
  /// `wrapped`.
  @JavaScriptActor
  public static func decodeOptional<Wrapped>(
    _ value: borrowing JavaScriptUnownedValue,
    in runtime: borrowing JavaScriptRuntime,
    wrapped: ElementDecoder<Wrapped>
  ) throws -> Wrapped? {
    if value.isUndefined() || value.isNull() {
      return nil
    }
    return try wrapped(value, runtime)
  }

  /// Encodes an optional into `slot`, as `null` when it's `nil` and with `wrapped` otherwise.
  @JavaScriptActor
  public static func encodeOptional<Wrapped>(
    _ value: Wrapped?,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime,
    wrapped: ElementEncoder<Wrapped>
  ) throws {
    guard let value else {
      slot.emplaceNull()
      return
    }
    try wrapped(value, slot, runtime)
  }

  /// Decodes an object into a `String`-keyed dictionary, converting each property with `value`. Like
  /// `Dictionary.decode`, a property whose value is `undefined` is left out.
  @JavaScriptActor
  public static func decodeDictionary<Value>(
    _ value: borrowing JavaScriptUnownedValue,
    in runtime: borrowing JavaScriptRuntime,
    value decodeValue: ElementDecoder<Value>
  ) throws -> [String: Value] {
    let object = try value.asObject(in: runtime)
    let keys = object.getPropertyNames()
    var result = [String: Value](minimumCapacity: keys.count)
    for key in keys {
      let decoded: Value? = try object.withUnownedProperty(key) { property in
        return property.isUndefined() ? nil : try decodeValue(property, runtime)
      }
      if let decoded {
        result[key] = decoded
      }
    }
    return result
  }

  /// Encodes a `String`-keyed dictionary into `slot` as an object, converting each value with `value`.
  @JavaScriptActor
  public static func encodeDictionary<Value>(
    _ value: [String: Value],
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime,
    value encodeValue: ElementEncoder<Value>
  ) throws {
    let object = runtime.createObject()
    for (key, element) in value {
      try object.setProperty(key) { propertySlot, runtime in
        try encodeValue(element, propertySlot, runtime)
      }
    }
    slot.emplace(object)
  }
}

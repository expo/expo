// Copyright 2026-present 650 Industries. All rights reserved.

// Conversions for tuples and for the containers that hold them. A tuple can't conform to a protocol,
// so it can't be `JavaScriptDecodable` or `JavaScriptEncodable` itself, and neither can an array,
// optional or dictionary of tuples. The macros convert these types through the methods below instead.
// Each method takes a closure that converts one element, so the conversions nest: the macros pass
// `T.decode` / `T.encode` for an element type that conforms, and another of these methods for one
// that holds a tuple.
//
// A tuple whose elements all conform has shorter overloads that take the element types instead of
// closures, so the code the macros generate for it stays small.
//
// An unlabeled tuple maps to a JavaScript array with one value per element, and a labeled tuple to an
// object with one property per label. The containers convert like their `JavaScriptCodable`
// conformances do.

extension JavaScriptValue {
  /// Converts a borrowed JavaScript value to a native value. Takes the runtime as a parameter so that
  /// a nested closure doesn't capture the borrowed runtime of the enclosing one.
  public typealias ElementDecoder<Element> = (
    _ value: borrowing JavaScriptUnownedValue,
    _ runtime: borrowing JavaScriptRuntime
  ) throws -> Element

  /// Converts a native value to a JavaScript value. See ``ElementDecoder``.
  public typealias ElementEncoder<Element> = (
    _ value: Element,
    _ runtime: borrowing JavaScriptRuntime
  ) throws -> JavaScriptValue

  // MARK: - Tuples

  /// Decodes a tuple, converting each element with the matching closure in `elements`. Without
  /// `labels`, the value must be an array with one value per tuple element. With `labels`, the value
  /// must be an object, and each element is read from the property named by the matching label.
  ///
  /// The result is unlabeled, and converts implicitly to a labeled tuple type. Throws `TypeError` when
  /// the value has the wrong shape, with the index or label of a failing element in its path.
  @JavaScriptActor
  public static func decodeTuple<each Element>(
    _ value: borrowing JavaScriptUnownedValue,
    labels: [String]? = nil,
    in runtime: borrowing JavaScriptRuntime,
    _ elements: repeat ElementDecoder<each Element>
  ) throws -> (repeat each Element) {
    let count = tupleElementCount(repeat (each Element).self)
    var index = 0
    guard let labels else {
      let array = try tupleArray(value, count: count, type: (repeat each Element).self, in: runtime)
      return (repeat try decodeTupleElement(of: array, at: &index, in: runtime, each elements))
    }
    precondition(labels.count == count, "Expected one label per tuple element")
    let object = try value.asObject(in: runtime)
    return (repeat try decodeTupleElement(of: object, labels: labels, at: &index, in: runtime, each elements))
  }

  /// Encodes a tuple, converting each element with the matching closure in `elements`. Without
  /// `labels`, the result is an array with one value per tuple element. With `labels`, it's an object
  /// with one property per element, named by the matching label.
  ///
  /// Takes an unlabeled tuple, so a labeled one is coerced with `as` at the call site.
  @JavaScriptActor
  public static func encodeTuple<each Element>(
    _ value: (repeat each Element),
    labels: [String]? = nil,
    in runtime: borrowing JavaScriptRuntime,
    _ elements: repeat ElementEncoder<each Element>
  ) throws -> JavaScriptValue {
    let count = tupleElementCount(repeat (each Element).self)
    var index = 0
    guard let labels else {
      let array = runtime.createArray(length: count)
      for (element, encode) in repeat (each value, each elements) {
        array.setValueUnchecked(try encode(element, runtime), at: index)
        index += 1
      }
      return array.asValue()
    }
    precondition(labels.count == count, "Expected one label per tuple element")
    let object = runtime.createObject()
    for (element, encode) in repeat (each value, each elements) {
      object.setProperty(labels[index], value: try encode(element, runtime))
      index += 1
    }
    return object.takeValue()
  }

  /// Decodes a tuple whose elements all conform to `JavaScriptDecodable`, like
  /// ``decodeTuple(_:labels:in:_:)`` with each element decoded through its type's `decode`.
  @JavaScriptActor
  public static func decodeTuple<each Element: JavaScriptDecodable>(
    _ value: borrowing JavaScriptUnownedValue,
    labels: [String]? = nil,
    as types: repeat (each Element).Type,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> (repeat each Element) {
    let count = tupleElementCount(repeat each types)
    var index = 0
    guard let labels else {
      let array = try tupleArray(value, count: count, type: (repeat each Element).self, in: runtime)
      return (repeat try decodeTupleElement(each types, of: array, at: &index, in: runtime))
    }
    precondition(labels.count == count, "Expected one label per tuple element")
    let object = try value.asObject(in: runtime)
    return (repeat try decodeTupleElement(each types, of: object, labels: labels, at: &index, in: runtime))
  }

  /// Encodes a tuple whose elements all conform to `JavaScriptEncodable`, like
  /// ``encodeTuple(_:labels:in:_:)`` with each element encoded through its type's `encode`.
  @JavaScriptActor
  public static func encodeTuple<each Element: JavaScriptEncodable>(
    _ value: (repeat each Element),
    labels: [String]? = nil,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> JavaScriptValue {
    let count = tupleElementCount(repeat (each Element).self)
    var index = 0
    guard let labels else {
      let array = runtime.createArray(length: count)
      for element in repeat each value {
        array.setValueUnchecked(try encodeTupleElement(element, in: runtime), at: index)
        index += 1
      }
      return array.asValue()
    }
    precondition(labels.count == count, "Expected one label per tuple element")
    let object = runtime.createObject()
    for element in repeat each value {
      object.setProperty(labels[index], value: try encodeTupleElement(element, in: runtime))
      index += 1
    }
    return object.takeValue()
  }

  // MARK: - Containers

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
    var index = 0
    return try value.getArray(in: runtime).mapUnowned { value in
      defer { index += 1 }
      do {
        return try element(value, runtime)
      } catch let error as TypeError {
        throw error.prependingPath("[\(index)]")
      }
    }
  }

  /// Encodes an array, converting each element with `element`.
  @JavaScriptActor
  public static func encodeArray<Element>(
    _ value: [Element],
    in runtime: borrowing JavaScriptRuntime,
    element: ElementEncoder<Element>
  ) throws -> JavaScriptValue {
    return try runtime.createArray(count: value.count) { index in
      return try element(value[index], runtime)
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

  /// Encodes an optional, as `null` when it's `nil` and with `wrapped` otherwise.
  @JavaScriptActor
  public static func encodeOptional<Wrapped>(
    _ value: Wrapped?,
    in runtime: borrowing JavaScriptRuntime,
    wrapped: ElementEncoder<Wrapped>
  ) throws -> JavaScriptValue {
    guard let value else {
      return .null()
    }
    return try wrapped(value, runtime)
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
        do {
          return property.isUndefined() ? nil : try decodeValue(property, runtime)
        } catch let error as TypeError {
          throw error.prependingPath(".\(key)")
        }
      }
      if let decoded {
        result[key] = decoded
      }
    }
    return result
  }

  /// Encodes a `String`-keyed dictionary as an object, converting each value with `value`.
  @JavaScriptActor
  public static func encodeDictionary<Value>(
    _ value: [String: Value],
    in runtime: borrowing JavaScriptRuntime,
    value encodeValue: ElementEncoder<Value>
  ) throws -> JavaScriptValue {
    let object = runtime.createObject()
    for (key, element) in value {
      object.setProperty(key, value: try encodeValue(element, runtime))
    }
    return object.takeValue()
  }

  // MARK: - Helpers

  /// Decodes the array element at `index` with `decode`, then advances `index`. A `TypeError` from the
  /// element gets the index added to the front of its path.
  @JavaScriptActor
  private static func decodeTupleElement<Element>(
    of array: borrowing JavaScriptArray,
    at index: inout Int,
    in runtime: borrowing JavaScriptRuntime,
    _ decode: ElementDecoder<Element>
  ) throws -> Element {
    defer { index += 1 }
    do {
      return try array.getValue(at: index).withUnownedValue(in: runtime) { value in
        return try decode(value, runtime)
      }
    } catch let error as TypeError {
      throw error.prependingPath("[\(index)]")
    }
  }

  /// Decodes the property named `labels[index]` with `decode`, then advances `index`. A `TypeError`
  /// from the element gets the label added to the front of its path.
  @JavaScriptActor
  private static func decodeTupleElement<Element>(
    of object: borrowing JavaScriptObject,
    labels: [String],
    at index: inout Int,
    in runtime: borrowing JavaScriptRuntime,
    _ decode: ElementDecoder<Element>
  ) throws -> Element {
    defer { index += 1 }
    let label = labels[index]
    do {
      return try object.withUnownedProperty(label) { property in
        return try decode(property, runtime)
      }
    } catch let error as TypeError {
      throw error.prependingPath(".\(label)")
    }
  }

  /// The array a tuple of `count` elements decodes from. Throws `TypeError`, naming the tuple `type`,
  /// when the value isn't an array or its length differs.
  @JavaScriptActor
  private static func tupleArray(
    _ value: borrowing JavaScriptUnownedValue,
    count: Int,
    type: any ~Copyable.Type,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> JavaScriptArray {
    guard value.isArray() else {
      throw TypeError(type: type)
    }
    let array = value.getArray(in: runtime)
    guard array.length == count else {
      throw TypeError(
        type: type,
        reason: "Expected an array of \(count) elements for '\(type)', but got \(array.length) elements"
      )
    }
    return array
  }

  /// Decodes the array element at `index` as `Element`, then advances `index`. See
  /// ``decodeTupleElement(of:at:in:_:)``.
  @JavaScriptActor
  private static func decodeTupleElement<Element: JavaScriptDecodable>(
    _ type: Element.Type,
    of array: borrowing JavaScriptArray,
    at index: inout Int,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> Element {
    return try decodeTupleElement(of: array, at: &index, in: runtime) { value, runtime in
      return try Element.decode(value, in: runtime)
    }
  }

  /// Decodes the property named `labels[index]` as `Element`, then advances `index`. See
  /// ``decodeTupleElement(of:labels:at:in:_:)``.
  @JavaScriptActor
  private static func decodeTupleElement<Element: JavaScriptDecodable>(
    _ type: Element.Type,
    of object: borrowing JavaScriptObject,
    labels: [String],
    at index: inout Int,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> Element {
    return try decodeTupleElement(of: object, labels: labels, at: &index, in: runtime) { value, runtime in
      return try Element.decode(value, in: runtime)
    }
  }

  @JavaScriptActor
  private static func encodeTupleElement<Element: JavaScriptEncodable>(
    _ element: Element,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> JavaScriptValue {
    return try Element.encode(element, in: runtime)
  }

  /// The number of elements in a tuple, given the metatype of each element.
  private static func tupleElementCount<each Element>(_ types: repeat (each Element).Type) -> Int {
    var count = 0
    for _ in repeat each types {
      count += 1
    }
    return count
  }
}

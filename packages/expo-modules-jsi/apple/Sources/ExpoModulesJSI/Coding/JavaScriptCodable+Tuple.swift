// Copyright 2026-present 650 Industries. All rights reserved.

internal import ExpoModulesJSI_Cxx
internal import jsi

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
// The encode methods write into a `JavaScriptValue.Slot`, like `JavaScriptEncodable.encode(_:into:in:)`, so
// a number, a boolean or a string in a tuple or a container never becomes a `JavaScriptValue`.
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

  /// Converts a native value to a JavaScript value written into `slot`, like
  /// ``JavaScriptEncodable/encode(_:into:in:)``: it writes exactly one value unless it throws (see
  /// ``JavaScriptValue/Slot``). See ``ElementDecoder`` for the runtime parameter.
  public typealias ElementEncoder<Element> = (
    _ value: Element,
    _ slot: borrowing JavaScriptValue.Slot,
    _ runtime: borrowing JavaScriptRuntime
  ) throws -> Void

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
    let object = try tupleObject(value, type: (repeat each Element).self, in: runtime)
    return (repeat try decodeTupleElement(of: object, labels: labels, at: &index, in: runtime, each elements))
  }

  /// Encodes a tuple into `slot`, converting each element with the matching closure in `elements`.
  /// Without `labels`, the value is an array with one value per tuple element. With `labels`, it's an
  /// object with one property per element, named by the matching label.
  ///
  /// Takes an unlabeled tuple, so a labeled one is coerced with `as` at the call site.
  @JavaScriptActor
  public static func encodeTuple<each Element>(
    _ value: (repeat each Element),
    labels: [String]? = nil,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime,
    _ elements: repeat ElementEncoder<each Element>
  ) throws {
    let count = tupleElementCount(repeat (each Element).self)
    guard let labels else {
      var writer = TupleArrayWriter(count: count)
      do {
        for (element, encode) in repeat (each value, each elements) {
          try writer.append(element, in: runtime, encode)
        }
      } catch {
        writer.discard()
        throw error
      }
      writer.finish(into: slot, in: runtime)
      return
    }
    precondition(labels.count == count, "Expected one label per tuple element")
    let object = runtime.createObject()
    var index = 0
    for (element, encode) in repeat (each value, each elements) {
      try setTupleProperty(of: object, named: labels[index], to: element, encode)
      index += 1
    }
    slot.emplace(object)
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
    let object = try tupleObject(value, type: (repeat each Element).self, in: runtime)
    return (repeat try decodeTupleElement(each types, of: object, labels: labels, at: &index, in: runtime))
  }

  /// Encodes a tuple whose elements all conform to `JavaScriptEncodable` into `slot`, like
  /// ``encodeTuple(_:labels:into:in:_:)`` with each element encoded through its type's
  /// `encode(_:into:in:)`.
  @JavaScriptActor
  public static func encodeTuple<each Element: JavaScriptEncodable>(
    _ value: (repeat each Element),
    labels: [String]? = nil,
    into slot: borrowing JavaScriptValue.Slot,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    let count = tupleElementCount(repeat (each Element).self)
    guard let labels else {
      var writer = TupleArrayWriter(count: count)
      do {
        for element in repeat each value {
          try writer.append(element, in: runtime)
        }
      } catch {
        writer.discard()
        throw error
      }
      writer.finish(into: slot, in: runtime)
      return
    }
    precondition(labels.count == count, "Expected one label per tuple element")
    let object = runtime.createObject()
    var index = 0
    for element in repeat each value {
      try object.setProperty(labels[index], encoding: element)
      index += 1
    }
    slot.emplace(object)
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
      // The length was checked by `tupleArray`, so the element is lent without a range check or a copy.
      return try array.withUnownedElementUnchecked(at: index) { value in
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

  /// The object a labeled tuple decodes from. Throws `TypeError`, naming the tuple `type`, when the value
  /// isn't an object.
  @JavaScriptActor
  private static func tupleObject(
    _ value: borrowing JavaScriptUnownedValue,
    type: any ~Copyable.Type,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> JavaScriptObject {
    guard value.isObject() else {
      throw TypeError(type: type)
    }
    return value.getObject(in: runtime)
  }

  /// Sets the property `name` of a labeled tuple's object to `element`, encoded with `encode`. Generic
  /// over one element, so the closure doesn't capture an element of a parameter pack.
  @JavaScriptActor
  private static func setTupleProperty<Element>(
    of object: borrowing JavaScriptObject,
    named name: String,
    to element: Element,
    _ encode: ElementEncoder<Element>
  ) throws {
    try object.setProperty(name) { slot, runtime in
      try encode(element, slot, runtime)
    }
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

  /// The number of elements in a tuple, given the metatype of each element.
  private static func tupleElementCount<each Element>(_ types: repeat (each Element).Type) -> Int {
    var count = 0
    for _ in repeat each types {
      count += 1
    }
    return count
  }
}

/// Collects the elements of an unlabeled tuple, encoded in order straight into a buffer of engine values,
/// and then moves them into a new array with one engine call, so no element becomes a `JavaScriptValue`.
/// The caller calls either `finish(into:in:)` or, when an encode throws, `discard()`.
private struct TupleArrayWriter {
  private let start: UnsafeMutablePointer<facebook.jsi.Value>
  private let count: Int
  private var written = 0

  init(count: Int) {
    self.start = .allocate(capacity: count)
    self.count = count
  }

  /// Encodes `element` with `encode` into the next slot.
  @JavaScriptActor
  mutating func append<Element>(
    _ element: Element,
    in runtime: borrowing JavaScriptRuntime,
    _ encode: JavaScriptValue.ElementEncoder<Element>
  ) throws {
    try encode(element, JavaScriptValue.Slot(start + written), runtime)
    written += 1
  }

  /// Encodes `element` with its type's `encode(_:into:in:)` into the next slot.
  @JavaScriptActor
  mutating func append<Element: JavaScriptEncodable>(_ element: Element, in runtime: borrowing JavaScriptRuntime) throws
  {
    try Element.encode(element, into: JavaScriptValue.Slot(start + written), in: runtime)
    written += 1
  }

  /// Moves the encoded elements into a new array, and the array into `slot`.
  func finish(into slot: borrowing JavaScriptValue.Slot, in runtime: borrowing JavaScriptRuntime) {
    var array = expo.createArrayForPushing(runtime.pointee, count)
    expo.pushValues(runtime.pointee, array, 0, start, count)
    expo.emplaceMovedArray(slot.pointer, &array)
    start.deallocate()
  }

  /// Releases the elements encoded so far. The slot of the element that threw holds no value.
  func discard() {
    expo.destroyValues(start, written)
    start.deallocate()
  }
}

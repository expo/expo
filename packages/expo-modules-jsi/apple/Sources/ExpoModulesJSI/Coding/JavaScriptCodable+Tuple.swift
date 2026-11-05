// Copyright 2026-present 650 Industries. All rights reserved.

internal import ExpoModulesJSI_Cxx
internal import jsi

// Conversions for tuples. A tuple can't conform to a protocol, so it can't be `JavaScriptDecodable` or
// `JavaScriptEncodable` itself. The macros convert a tuple through the methods below instead, which take a
// closure per element, so the conversions nest: the macros pass `T.decode` / `T.encode` for an element type
// that conforms, and another conversion for one that holds a tuple. A tuple whose elements all conform has
// shorter overloads that take the element types instead, so the code the macros generate for it stays small.
// The arrays, optionals and dictionaries that hold tuples convert through the closure-based container
// methods in `JavaScriptCodable+Containers.swift`.
//
// An unlabeled tuple maps to a JavaScript array with one value per element, and a labeled tuple to an
// object with one property per label. The encode methods write into a `JavaScriptValue.Slot`, like
// `JavaScriptEncodable.encode(_:into:in:)`, so a number, a boolean or a string in a tuple never becomes a
// `JavaScriptValue`.

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

  /// Decodes a tuple, converting each element with the matching closure in `elements`. Without
  /// `labels`, the value must be an array with one value per tuple element. With `labels`, the value
  /// must be an object, and each element is read from the property named by the matching label.
  ///
  /// The result is unlabeled, and converts implicitly to a labeled tuple type. Throws `TypeError` when
  /// the value has the wrong shape.
  @JavaScriptActor
  public static func decodeTuple<each Element>(
    _ value: borrowing JavaScriptUnownedValue,
    labels: [String]? = nil,
    in runtime: borrowing JavaScriptRuntime,
    _ elements: repeat ElementDecoder<each Element>
  ) throws -> (repeat each Element) {
    var reader = try TupleReader(value, labels: labels, of: repeat (each Element).self, in: runtime)
    defer { reader.release() }
    return (repeat try reader.next(each elements, in: runtime))
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
    var reader = try TupleReader(value, labels: labels, of: repeat each types, in: runtime)
    defer { reader.release() }
    return (repeat try reader.next(each types, in: runtime))
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
    var writer = TupleWriter(labels: labels, of: repeat (each Element).self)
    do {
      for (element, encode) in repeat (each value, each elements) {
        try writer.append(element, encode, in: runtime)
      }
    } catch {
      writer.discard()
      throw error
    }
    writer.finish(into: slot, in: runtime)
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
    var writer = TupleWriter(labels: labels, of: repeat (each Element).self)
    do {
      for element in repeat each value {
        try writer.append(element, in: runtime)
      }
    } catch {
      writer.discard()
      throw error
    }
    writer.finish(into: slot, in: runtime)
  }
}

/// The elements of a tuple, read in order from the array or the object that the tuple decodes from: by
/// index from an array, or by label from an object. They are held as engine values, so each one is lent to
/// its decode without a `JavaScriptValue`. The caller calls `release()` when it's done.
private struct TupleReader {
  private let elements: UnsafeMutablePointer<facebook.jsi.Value>
  private let count: Int
  private let jsiRuntime: facebook.jsi.IRuntime
  private var index = 0

  /// Reads the elements of a tuple of the given element types from `value`. Throws `TypeError`, naming the
  /// tuple type, when the value isn't an array of the tuple's length (or an object, with `labels`).
  @JavaScriptActor
  init<each Element>(
    _ value: borrowing JavaScriptUnownedValue,
    labels: [String]?,
    of types: repeat (each Element).Type,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    let type = (repeat each Element).self
    let count = tupleElementCount(repeat each types)
    let jsiRuntime = runtime.pointee
    if let labels {
      assert(labels.count == count, "Expected one label per tuple element")
      guard value.isObject() else {
        throw JavaScriptValue.TypeError(type: type)
      }
      let object = value.getObject(in: runtime)
      elements = .allocate(capacity: count)
      for (index, label) in labels.enumerated() {
        (elements + index).initialize(to: object.pointee.getProperty(jsiRuntime, label.toJSIPropNameID(in: jsiRuntime)))
      }
    } else {
      guard value.isArray() else {
        throw JavaScriptValue.TypeError(type: type)
      }
      let array = value.getArray(in: runtime)
      let length = array.length
      guard length == count else {
        throw JavaScriptValue.TypeError(
          type: type,
          reason: "Expected an array of \(count) elements for '\(type)', but got \(length) elements"
        )
      }
      elements = .allocate(capacity: count)
      for index in 0..<count {
        (elements + index).initialize(to: array.pointee.getValueAtIndex(jsiRuntime, index))
      }
    }
    self.count = count
    self.jsiRuntime = jsiRuntime
  }

  /// Decodes the next element with `decode`.
  @JavaScriptActor
  mutating func next<Element>(
    _ decode: JavaScriptValue.ElementDecoder<Element>,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> Element {
    defer { index += 1 }
    return try decode(JavaScriptUnownedValue(jsiRuntime, elements + index), runtime)
  }

  /// Decodes the next element with its type's `decode`.
  @JavaScriptActor
  mutating func next<Element: JavaScriptDecodable>(
    _ type: Element.Type,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> Element {
    return try next({ value, runtime in return try Element.decode(value, in: runtime) }, in: runtime)
  }

  /// Releases the elements.
  func release() {
    expo.destroyValues(elements, count)
    elements.deallocate()
  }
}

/// Collects the elements of a tuple, encoded in order straight into a buffer of engine values, and then
/// moves them into a new array with one engine call, or sets them as the properties of a new object, named
/// by `labels`. So no element becomes a `JavaScriptValue`. The caller calls either `finish(into:in:)` or,
/// when an encode throws, `discard()`.
private struct TupleWriter {
  private let elements: UnsafeMutablePointer<facebook.jsi.Value>
  private let count: Int
  private let labels: [String]?
  private var written = 0

  init<each Element>(labels: [String]?, of types: repeat (each Element).Type) {
    let count = tupleElementCount(repeat each types)
    assert(labels == nil || labels?.count == count, "Expected one label per tuple element")
    self.elements = .allocate(capacity: count)
    self.count = count
    self.labels = labels
  }

  /// Encodes `element` with `encode` into the next slot.
  @JavaScriptActor
  mutating func append<Element>(
    _ element: Element,
    _ encode: JavaScriptValue.ElementEncoder<Element>,
    in runtime: borrowing JavaScriptRuntime
  ) throws {
    try encode(element, JavaScriptValue.Slot(elements + written), runtime)
    written += 1
  }

  /// Encodes `element` with its type's `encode(_:into:in:)` into the next slot.
  @JavaScriptActor
  mutating func append<Element: JavaScriptEncodable>(_ element: Element, in runtime: borrowing JavaScriptRuntime) throws
  {
    try Element.encode(element, into: JavaScriptValue.Slot(elements + written), in: runtime)
    written += 1
  }

  /// Moves the encoded elements into a new array, or sets them as the properties of a new object, and moves
  /// that into `slot`.
  func finish(into slot: borrowing JavaScriptValue.Slot, in runtime: borrowing JavaScriptRuntime) {
    let jsiRuntime = runtime.pointee
    if let labels {
      let object = runtime.createObject()
      for (index, label) in labels.enumerated() {
        expo.setProperty(jsiRuntime, object.pointee, label.toJSIPropNameID(in: jsiRuntime), elements[index])
      }
      expo.destroyValues(elements, count)
      slot.emplace(object)
    } else {
      var array = expo.createArrayForPushing(jsiRuntime, count)
      expo.pushValues(jsiRuntime, array, 0, elements, count)
      expo.emplaceMovedArray(slot.pointer, &array)
    }
    elements.deallocate()
  }

  /// Releases the elements encoded so far. The slot of the element that threw holds no value.
  func discard() {
    expo.destroyValues(elements, written)
    elements.deallocate()
  }
}

/// The number of elements in a tuple, given the metatype of each element.
private func tupleElementCount<each Element>(_ types: repeat (each Element).Type) -> Int {
  var count = 0
  for _ in repeat each types {
    count += 1
  }
  return count
}

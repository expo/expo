// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

// The calls are spelled as the macros generate them: a tuple whose elements all conform passes the
// element types, and any other tuple converts each element through a closure that takes the value and
// the runtime.
@Suite("JavaScriptCodable+Tuple")
@JavaScriptActor
struct JavaScriptCodableTupleTests {
  let runtime = JavaScriptRuntime()

  /// Creates the value that `encode` writes into a slot.
  private func encoded(_ encode: (borrowing JavaScriptValue.Slot) throws -> Void) throws -> JavaScriptValue {
    return try JavaScriptValue.encoding(in: runtime, encode)
  }

  /// Evaluates `source` and passes the result to `body` as a borrowed value.
  private func withValue<R>(_ source: String, _ body: (borrowing JavaScriptUnownedValue) throws -> R) throws -> R {
    return try runtime.eval(source).withUnownedValue(in: runtime) { value in
      return try body(value)
    }
  }

  // MARK: - Unlabeled

  @Test
  func `decodes an array into an unlabeled tuple`() throws {
    let decoded = try withValue("[1, 'a', true]") { value in
      return try JavaScriptValue.decodeTuple(
        value,
        in: runtime,
        { value, runtime in return try Int.decode(value, in: runtime) },
        { value, runtime in return try String.decode(value, in: runtime) },
        { value, runtime in return try Bool.decode(value, in: runtime) }
      )
    }
    #expect(decoded == (1, "a", true))
  }

  @Test
  func `throws for a value that isn't an array`() throws {
    #expect(throws: JavaScriptValue.TypeError.self) {
      try withValue("({ 0: 1, 1: 2 })") { value in
        _ = try JavaScriptValue.decodeTuple(
          value,
          in: runtime,
          { value, runtime in return try Int.decode(value, in: runtime) },
          { value, runtime in return try Int.decode(value, in: runtime) }
        )
      }
    }
  }

  @Test
  func `throws for an array of the wrong length`() throws {
    let error = #expect(throws: JavaScriptValue.TypeError.self) {
      try withValue("[1, 2, 3]") { value in
        _ = try JavaScriptValue.decodeTuple(
          value,
          in: runtime,
          { value, runtime in return try Int.decode(value, in: runtime) },
          { value, runtime in return try Int.decode(value, in: runtime) }
        )
      }
    }
    #expect(error?.description == "TypeError: Expected an array of 2 elements for '(Int, Int)', but got 3 elements")
  }

  @Test
  func `throws the error of a failing element`() throws {
    let error = #expect(throws: JavaScriptValue.TypeError.self) {
      try withValue("[1, 2]") { value in
        _ = try JavaScriptValue.decodeTuple(
          value,
          in: runtime,
          { value, runtime in return try Int.decode(value, in: runtime) },
          { value, runtime in return try String.decode(value, in: runtime) }
        )
      }
    }
    #expect(error?.description == "TypeError: Value cannot be represented as String")
  }

  @Test
  func `encodes an unlabeled tuple as an array`() throws {
    let array = try encoded { slot in
      try JavaScriptValue.encodeTuple(
        (1, "a"),
        into: slot,
        in: runtime,
        { value, slot, runtime in try Int.encode(value, into: slot, in: runtime) },
        { value, slot, runtime in try String.encode(value, into: slot, in: runtime) }
      )
    }.getArray()
    #expect(array.length == 2)
    #expect(try array.getValue(at: 0).getInt() == 1)
    #expect(try array.getValue(at: 1).getString() == "a")
  }

  @Test
  func `decodes a tuple of conforming elements from their types`() throws {
    let decoded: (x: Int, y: String) = try withValue("({ x: 1, y: 'a' })") { value in
      return try JavaScriptValue.decodeTuple(value, labels: ["x", "y"], as: Int.self, String.self, in: runtime)
    }
    #expect(decoded == (x: 1, y: "a"))
  }

  @Test
  func `encodes a tuple of conforming elements without closures`() throws {
    let array = try encoded { slot in try JavaScriptValue.encodeTuple((1, "a"), into: slot, in: runtime) }.getArray()
    #expect(array.length == 2)
    #expect(try array.getValue(at: 0).getInt() == 1)
    #expect(try array.getValue(at: 1).getString() == "a")
  }

  @Test
  func `encodes a labeled tuple of conforming elements as an object`() throws {
    let point: (x: Int, y: String) = (x: 1, y: "a")
    let object = try encoded { slot in
      try JavaScriptValue.encodeTuple(point as (Int, String), labels: ["x", "y"], into: slot, in: runtime)
    }.getObject()
    #expect(object.getProperty("x").getInt() == 1)
    #expect(object.getProperty("y").getString() == "a")
  }

  @Test
  func `releases the encoded elements when a later element throws`() throws {
    struct EncodeFailure: Error {}
    #expect(throws: EncodeFailure.self) {
      _ = try encoded { slot in
        try JavaScriptValue.encodeTuple(
          ("a", "b"),
          into: slot,
          in: runtime,
          { value, slot, runtime in try String.encode(value, into: slot, in: runtime) },
          { _, _, _ in throw EncodeFailure() }
        )
      }
    }
  }

  // MARK: - Labeled

  @Test
  func `decodes an object into a labeled tuple`() throws {
    let decoded: (x: Double, y: Double) = try withValue("({ x: 1.5, y: 2.5 })") { value in
      return try JavaScriptValue.decodeTuple(
        value,
        labels: ["x", "y"],
        in: runtime,
        { value, runtime in return try Double.decode(value, in: runtime) },
        { value, runtime in return try Double.decode(value, in: runtime) }
      )
    }
    #expect(decoded.x == 1.5)
    #expect(decoded.y == 2.5)
  }

  @Test
  func `throws the error of a missing labeled element`() throws {
    #expect(throws: JavaScriptValue.TypeError.self) {
      try withValue("({ x: 1 })") { value in
        _ = try JavaScriptValue.decodeTuple(
          value,
          labels: ["x", "y"],
          in: runtime,
          { value, runtime in return try Int.decode(value, in: runtime) },
          { value, runtime in return try Int.decode(value, in: runtime) }
        )
      }
    }
  }

  @Test
  func `names the labeled tuple type when the value isn't an object`() throws {
    let error = #expect(throws: JavaScriptValue.TypeError.self) {
      try withValue("42") { value in
        _ = try JavaScriptValue.decodeTuple(value, labels: ["x", "y"], as: Int.self, Int.self, in: runtime)
      }
    }
    #expect(error?.description == "TypeError: Value cannot be represented as (Int, Int)")
  }

  @Test
  func `encodes a labeled tuple as an object`() throws {
    let point: (x: Int, y: Int) = (x: 3, y: 4)
    let object = try encoded { slot in
      try JavaScriptValue.encodeTuple(
        point as (Int, Int),
        labels: ["x", "y"],
        into: slot,
        in: runtime,
        { value, slot, runtime in try Int.encode(value, into: slot, in: runtime) },
        { value, slot, runtime in try Int.encode(value, into: slot, in: runtime) }
      )
    }.getObject()
    #expect(object.getProperty("x").getInt() == 3)
    #expect(object.getProperty("y").getInt() == 4)
  }

  // MARK: - Nesting

  @Test
  func `decodes an array of labeled tuples holding a tuple`() throws {
    let decoded: [(name: String, range: (Int, Int))] = try withValue("[{ name: 'a', range: [1, 2] }]") { value in
      return try JavaScriptValue.decodeArray(value, in: runtime) { value, runtime in
        return try JavaScriptValue.decodeTuple(
          value,
          labels: ["name", "range"],
          in: runtime,
          { value, runtime in return try String.decode(value, in: runtime) },
          { value, runtime in
            return try JavaScriptValue.decodeTuple(
              value,
              in: runtime,
              { value, runtime in return try Int.decode(value, in: runtime) },
              { value, runtime in return try Int.decode(value, in: runtime) }
            )
          }
        )
      }
    }
    #expect(decoded.count == 1)
    #expect(decoded[0].name == "a")
    #expect(decoded[0].range == (1, 2))
  }

  @Test
  func `throws the error of a failing nested element`() throws {
    #expect(throws: JavaScriptValue.TypeError.self) {
      try withValue("({ a: [[1, 'x']] })") { value in
        _ = try JavaScriptValue.decodeDictionary(value, in: runtime) { value, runtime in
          return try JavaScriptValue.decodeArray(value, in: runtime) { value, runtime in
            return try JavaScriptValue.decodeTuple(
              value,
              in: runtime,
              { value, runtime in return try Int.decode(value, in: runtime) },
              { value, runtime in return try Int.decode(value, in: runtime) }
            )
          }
        }
      }
    }
  }

  @Test
  func `round-trips a dictionary of optional tuples`() throws {
    let values: [String: (Int, Int)?] = ["a": (1, 2), "b": nil]
    let object = try encoded { slot in
      try JavaScriptValue.encodeDictionary(values, into: slot, in: runtime) { value, slot, runtime in
        try JavaScriptValue.encodeOptional(value, into: slot, in: runtime) { value, slot, runtime in
          try JavaScriptValue.encodeTuple(value, into: slot, in: runtime)
        }
      }
    }
    let decoded: [String: (Int, Int)?] = try object.withUnownedValue(in: runtime) { value in
      return try JavaScriptValue.decodeDictionary(value, in: runtime) { value, runtime in
        return try JavaScriptValue.decodeOptional(value, in: runtime) { value, runtime in
          return try JavaScriptValue.decodeTuple(
            value,
            in: runtime,
            { value, runtime in return try Int.decode(value, in: runtime) },
            { value, runtime in return try Int.decode(value, in: runtime) }
          )
        }
      }
    }
    #expect(decoded.count == 2)
    #expect(decoded["a"]!! == (1, 2))
    #expect(decoded["b"]! == nil)
  }

  @Test
  func `encodes an array of tuples`() throws {
    let array = try encoded { slot in
      try JavaScriptValue.encodeArray([(1, "a"), (2, "b")], into: slot, in: runtime) { value, slot, runtime in
        try JavaScriptValue.encodeTuple(value, into: slot, in: runtime)
      }
    }.getArray()
    #expect(array.length == 2)
    #expect(try array.getValue(at: 1).getArray().getValue(at: 1).getString() == "b")
  }

  @Test
  func `decodes null as nil for an optional tuple`() throws {
    let decoded: (Int, Int)? = try withValue("null") { value in
      return try JavaScriptValue.decodeOptional(value, in: runtime) { value, runtime in
        return try JavaScriptValue.decodeTuple(
          value,
          in: runtime,
          { value, runtime in return try Int.decode(value, in: runtime) },
          { value, runtime in return try Int.decode(value, in: runtime) }
        )
      }
    }
    #expect(decoded == nil)
  }

  // MARK: - Containers

  @Test
  func `decodes a single value that isn't an array as a one-element array`() throws {
    let decoded: [(x: Int, y: Int)] = try withValue("({ x: 1, y: 2 })") { value in
      return try JavaScriptValue.decodeArray(value, in: runtime) { value, runtime in
        return try JavaScriptValue.decodeTuple(value, labels: ["x", "y"], as: Int.self, Int.self, in: runtime)
      }
    }
    #expect(decoded.count == 1)
    #expect(decoded[0] == (x: 1, y: 2))
  }

  @Test
  func `skips undefined properties when decoding a dictionary`() throws {
    let decoded: [String: (Int, Int)] = try withValue("({ a: [1, 2], b: undefined })") { value in
      return try JavaScriptValue.decodeDictionary(value, in: runtime) { value, runtime in
        return try JavaScriptValue.decodeTuple(value, as: Int.self, Int.self, in: runtime)
      }
    }
    #expect(decoded.count == 1)
    #expect(decoded["a"]! == (1, 2))
  }

  @Test
  func `decodes undefined as nil for an optional tuple`() throws {
    let decoded: (Int, Int)? = try withValue("undefined") { value in
      return try JavaScriptValue.decodeOptional(value, in: runtime) { value, runtime in
        return try JavaScriptValue.decodeTuple(value, as: Int.self, Int.self, in: runtime)
      }
    }
    #expect(decoded == nil)
  }

  @Test
  func `encodes nil as null for an optional tuple`() throws {
    let value: (Int, Int)? = nil
    let encodedValue = try encoded { slot in
      try JavaScriptValue.encodeOptional(value, into: slot, in: runtime) { value, slot, runtime in
        try JavaScriptValue.encodeTuple(value, into: slot, in: runtime)
      }
    }
    let isNull = encodedValue.isNull()
    #expect(isNull)
  }

  // MARK: - Slots

  @Test
  func `sets a property to the value encoded into its slot`() throws {
    let object = runtime.createObject()
    try object.setProperty("pair") { slot, runtime in
      try JavaScriptValue.encodeTuple((1, 2), into: slot, in: runtime)
    }
    #expect(try object.getProperty("pair").getArray().getValue(at: 1).getInt() == 2)
  }
}

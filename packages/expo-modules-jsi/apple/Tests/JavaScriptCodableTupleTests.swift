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
  func `names the failing element index in the error path`() throws {
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
    #expect(error?.description.hasSuffix("(path: [1])") == true)
  }

  @Test
  func `encodes an unlabeled tuple as an array`() throws {
    let array = try JavaScriptValue.encodeTuple(
      (1, "a"),
      in: runtime,
      { value, runtime in return try Int.encode(value, in: runtime) },
      { value, runtime in return try String.encode(value, in: runtime) }
    ).getArray()
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
    let array = try JavaScriptValue.encodeTuple((1, "a"), in: runtime).getArray()
    #expect(try array.getValue(at: 0).getInt() == 1)
    #expect(try array.getValue(at: 1).getString() == "a")
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
  func `names the failing label in the error path`() throws {
    let error = #expect(throws: JavaScriptValue.TypeError.self) {
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
    #expect(error?.description.hasSuffix("(path: y)") == true)
  }

  @Test
  func `encodes a labeled tuple as an object`() throws {
    let point: (x: Int, y: Int) = (x: 3, y: 4)
    let object = try JavaScriptValue.encodeTuple(
      point as (Int, Int),
      labels: ["x", "y"],
      in: runtime,
      { value, runtime in return try Int.encode(value, in: runtime) },
      { value, runtime in return try Int.encode(value, in: runtime) }
    ).getObject()
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
  func `names the full path of a failing nested element`() throws {
    let error = #expect(throws: JavaScriptValue.TypeError.self) {
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
    #expect(error?.description.hasSuffix("(path: a[0][1])") == true)
  }

  @Test
  func `round-trips a dictionary of optional tuples`() throws {
    let values: [String: (Int, Int)?] = ["a": (1, 2), "b": nil]
    let encoded = try JavaScriptValue.encodeDictionary(values, in: runtime) { value, runtime in
      return try JavaScriptValue.encodeOptional(value, in: runtime) { value, runtime in
        return try JavaScriptValue.encodeTuple(
          value,
          in: runtime,
          { value, runtime in return try Int.encode(value, in: runtime) },
          { value, runtime in return try Int.encode(value, in: runtime) }
        )
      }
    }
    let decoded: [String: (Int, Int)?] = try encoded.withUnownedValue(in: runtime) { value in
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
    let encoded = try JavaScriptValue.encodeArray([(1, "a"), (2, "b")], in: runtime) { value, runtime in
      return try JavaScriptValue.encodeTuple(
        value,
        in: runtime,
        { value, runtime in return try Int.encode(value, in: runtime) },
        { value, runtime in return try String.encode(value, in: runtime) }
      )
    }
    let array = encoded.getArray()
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
}

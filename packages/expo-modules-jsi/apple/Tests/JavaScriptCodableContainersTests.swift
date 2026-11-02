// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

@Suite("JavaScriptCodable+Containers")
@JavaScriptActor
struct JavaScriptCodableContainersTests {
  let runtime = JavaScriptRuntime()

  // MARK: - Array

  @Test
  func `decodes an array of ints`() throws {
    let decoded = try [Int].decode(runtime.eval("[1, 2, 3]"), in: runtime)
    #expect(decoded == [1, 2, 3])
  }

  @Test
  func `encodes an array of strings`() throws {
    let encoded = try [String].encode(["a", "b"], in: runtime)
    let array = encoded.getArray()
    #expect(array.length == 2)
    #expect(try array.getValue(at: 0).getString() == "a")
    #expect(try array.getValue(at: 1).getString() == "b")
  }

  @Test
  func `round-trips a nested array`() throws {
    let decoded = try [[Double]].decode(runtime.eval("[[1.5], [2.5, 3.5]]"), in: runtime)
    #expect(decoded == [[1.5], [2.5, 3.5]])
  }

  @Test
  func `round-trips an empty array`() throws {
    #expect(try [Int].decode(runtime.eval("[]"), in: runtime) == [])
    #expect(try [Int].encode([], in: runtime).getArray().length == 0)
  }

  // Arrays longer than one chunk of 64 values, so the elements go through more than one push.

  @Test
  func `encodes an array of ints into slots`() throws {
    let values = Array(0..<150)
    let array = try [Int].encode(values, in: runtime).getArray()
    #expect(array.length == 150)
    for index in values {
      #expect(try array.getValue(at: index).getInt() == index)
    }
  }

  @Test
  func `encodes an array of doubles into slots`() throws {
    let values = (0..<150).map { Double($0) + 0.5 }
    let array = try [Double].encode(values, in: runtime).getArray()
    #expect(array.length == 150)
    for (index, value) in values.enumerated() {
      #expect(try array.getValue(at: index).getDouble() == value)
    }
  }

  @Test
  func `encodes an array of bools into slots`() throws {
    let values = (0..<150).map { $0 % 3 == 0 }
    let array = try [Bool].encode(values, in: runtime).getArray()
    #expect(array.length == 150)
    for (index, value) in values.enumerated() {
      #expect(try array.getValue(at: index).getBool() == value)
    }
  }

  @Test
  func `encodes an array of strings into slots`() throws {
    let values = (0..<150).map { index in
      switch index % 3 {
      case 0: return ""
      case 1: return "café \(index)"
      default: return "item \(index)"
      }
    }
    let array = try [String].encode(values, in: runtime).getArray()
    #expect(array.length == 150)
    for (index, value) in values.enumerated() {
      #expect(try array.getValue(at: index).getString() == value)
    }
  }

  @Test
  func `encodes an array of optionals into slots`() throws {
    let values: [String?] = (0..<150).map { $0 % 2 == 0 ? "item \($0)" : nil }
    let array = try [String?].encode(values, in: runtime).getArray()
    #expect(array.length == 150)
    for (index, value) in values.enumerated() {
      let element = try array.getValue(at: index)
      let isNull = element.isNull()
      if let value {
        #expect(element.getString() == value)
      } else {
        #expect(isNull)
      }
    }
  }

  @Test
  func `encodes arrays of the other number types into slots`() throws {
    let floats = try [Float].decode([Float].encode([1.5, -2], in: runtime), in: runtime)
    #expect(floats == [1.5, -2])
    let bytes = try [UInt8].decode([UInt8].encode([0, 255], in: runtime), in: runtime)
    #expect(bytes == [0, 255])
    let int32s = try [Int32].decode([Int32].encode([.min, .max], in: runtime), in: runtime)
    #expect(int32s == [.min, .max])
    let uints = try [UInt].decode([UInt].encode([0, 1 << 53 - 1], in: runtime), in: runtime)
    #expect(uints == [0, 1 << 53 - 1])
    #expect(throws: UnsafeIntegerException.self) {
      _ = try [UInt].encode([1, 1 << 53], in: runtime)
    }
  }

  @Test
  func `encodes nested arrays and dictionaries into slots`() throws {
    let nested = try [[Int]].encode([[1, 2], [], [3]], in: runtime).getArray()
    #expect(try [[Int]].decode(nested.asValue(), in: runtime) == [[1, 2], [], [3]])
    let dictionaries = try [[String: Int]].encode([["a": 1], ["b": 2]], in: runtime).getArray()
    #expect(try [[String: Int]].decode(dictionaries.asValue(), in: runtime) == [["a": 1], ["b": 2]])
    let object = runtime.createObject()
    try object.setProperty("tags", encoding: ["x", "y"])
    try object.setProperty("counts", encoding: ["x": 1])
    #expect(try [String].decode(object.getProperty("tags"), in: runtime) == ["x", "y"])
    #expect(try [String: Int].decode(object.getProperty("counts"), in: runtime) == ["x": 1])
  }

  @Test
  func `throws from a nested array element without leaking the outer chunk`() throws {
    var values = Array(repeating: [1], count: 70)
    values[69] = [1, Int.max]
    #expect(throws: UnsafeIntegerException.self) {
      _ = try [[Int]].encode(values, in: runtime)
    }
  }

  @Test
  func `encodes elements without a slot override`() throws {
    // `Array` goes through the default `encode(_:into:in:)`, also when `Optional` forwards to it.
    let array = try [[Int]?].encode([[1, 2], nil, []], in: runtime).getArray()
    #expect(array.length == 3)
    #expect(try [Int].decode(array.getValue(at: 0), in: runtime) == [1, 2])
    #expect(try array.getValue(at: 1).isNull())
    #expect(try array.getValue(at: 2).getArray().length == 0)
  }

  @Test
  func `throws when an element in the middle of a chunk fails to encode`() throws {
    var values = Array(0..<150)
    values[100] = Int.max
    #expect(throws: UnsafeIntegerException.self) {
      _ = try [Int].encode(values, in: runtime)
    }
  }

  @Test
  func `releases the encoded elements when a later element throws`() throws {
    // With chunks of 64 values, element 80 sits in the chunk, not yet pushed to the array, when
    // element 90 throws. Only the chunk's cleanup can release it.
    let recorder = WeakObjectRecorder()
    let values = (0..<100).map { index in
      FailingEncodable(fails: index == 90, recorder: index == 80 ? recorder : nil)
    }
    #expect(throws: FailingEncodable.Failure.self) {
      _ = try [FailingEncodable].encode(values, in: runtime)
    }
    runtime.collectGarbage { recorder.object?.lock() == nil }
    let stillAlive = recorder.object?.lock() != nil
    #expect(stillAlive == false)
  }

  @Test
  func `arrayizes a non-array scalar, matching v1`() throws {
    // v1 `DynamicArrayType` wraps a non-array value into a single-element array.
    #expect(try [Int].decode(runtime.eval("42"), in: runtime) == [42])
  }

  // MARK: - Optional

  @Test
  func `decodes a present and absent optional`() throws {
    #expect(try Int?.decode(runtime.eval("42"), in: runtime) == 42)
    #expect(try Int?.decode(runtime.eval("null"), in: runtime) == nil)
    #expect(try Int?.decode(runtime.eval("undefined"), in: runtime) == nil)
  }

  @Test
  func `encodes a present optional and nil as null`() throws {
    #expect(try Int?.encode(7, in: runtime).getInt() == 7)
    #expect(try Int?.encode(nil, in: runtime).isNull() == true)
  }

  @Test
  func `decodes an array of optionals`() throws {
    let decoded = try [Int?].decode(runtime.eval("[1, null, 3]"), in: runtime)
    #expect(decoded == [1, nil, 3])
  }

  // MARK: - Dictionary

  @Test
  func `decodes a string-keyed dictionary`() throws {
    let decoded = try [String: Int].decode(runtime.eval("({ a: 1, b: 2 })"), in: runtime)
    #expect(decoded == ["a": 1, "b": 2])
  }

  @Test
  func `encodes a string-keyed dictionary`() throws {
    let encoded = try [String: Int].encode(["x": 9], in: runtime)
    #expect(encoded.getObject().getProperty("x").getInt() == 9)
  }

  @Test
  func `round-trips an empty dictionary`() throws {
    #expect(try [String: Int].decode(runtime.eval("({})"), in: runtime) == [:])
    let encoded = try [String: Int].encode([:], in: runtime)
    #expect(encoded.getObject().getPropertyNames().isEmpty)
  }

  @Test
  func `decode skips undefined-valued properties, matching v1`() throws {
    // An `undefined`-valued property is treated as absent rather than decoded (which would throw
    // for a non-optional value), matching the v1 dictionary converter.
    let decoded = try [String: Int].decode(
      runtime.eval("({ a: 1, b: undefined })"),
      in: runtime
    )
    #expect(decoded == ["a": 1])
  }

  // MARK: - Zero-copy borrowed-value overload

  @Test
  func `decodes an optional from a borrowed value, present and absent`() throws {
    let buffer = JavaScriptValuesBuffer.allocate(
      in: runtime,
      with: 7,
      JavaScriptValue.null().ref(),
      JavaScriptValue.undefined().ref()
    )
    #expect(try Int?.decode(buffer.unownedValue(at: 0), in: runtime) == 7)
    #expect(try Int?.decode(buffer.unownedValue(at: 1), in: runtime) == nil)
    #expect(try Int?.decode(buffer.unownedValue(at: 2), in: runtime) == nil)
  }
}

/// Encodes as a new JavaScript object through the default `encode(_:into:in:)`, or throws. With a
/// recorder, it keeps a weak reference to the object it creates.
private struct FailingEncodable: JavaScriptEncodable {
  struct Failure: Error {}

  let fails: Bool
  let recorder: WeakObjectRecorder?

  static func encode(_ value: FailingEncodable, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    if value.fails {
      throw Failure()
    }
    let object = runtime.createObject()
    value.recorder?.object = object.createWeak()
    return object.takeValue()
  }
}

private final class WeakObjectRecorder {
  var object: JavaScriptWeakObject?
}

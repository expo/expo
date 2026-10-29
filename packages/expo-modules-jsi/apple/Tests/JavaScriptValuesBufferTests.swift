import ExpoModulesJSI
import Testing

@Suite
@JavaScriptActor
struct JavaScriptValuesBufferTests {
  let runtime = JavaScriptRuntime()

  @Test
  func `allocate with values populates count and subscript`() throws {
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: 1, "two", true)
    #expect(buffer.count == 3)
    #expect(try buffer[0].asInt() == 1)
    #expect(try buffer[1].asString() == "two")
    #expect(try buffer[2].asBool() == true)
  }

  @Test
  func `copying accepts runtime-free values`() throws {
    let buffer = JavaScriptValuesBuffer.copying(
      in: runtime,
      values: [
        JavaScriptValue.Ref(.undefined()), JavaScriptValue.Ref(.null()), JavaScriptValue.Ref(.number(1)),
        JavaScriptValue.Ref(.true()), JavaScriptValue.Ref(JavaScriptValue(runtime, "four")),
      ]
    )
    #expect(buffer.count == 5)
    #expect(buffer[0].isUndefined() == true)
    #expect(buffer[1].isNull() == true)
    #expect(try buffer[2].asInt() == 1)
    #expect(try buffer[3].asBool() == true)
    #expect(try buffer[4].asString() == "four")
  }

  @Test
  func `empty buffer has zero count and deinits cleanly`() {
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 0)
    #expect(buffer.count == 0)
    // Deinit running cleanly is the assertion — no crash on deallocate of an empty buffer.
  }

  @Test
  func `copy produces an independent buffer with the same values`() throws {
    let original = JavaScriptValuesBuffer.allocate(in: runtime, with: 42, "hello")
    let duplicate = original.copy()

    #expect(duplicate.count == original.count)
    #expect(try duplicate[0].asInt() == 42)
    #expect(try duplicate[1].asString() == "hello")
  }

  @Test
  func `map enumerates values in order`() {
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: 1, 2, 3)
    let values = buffer.map { value, _ in (try? value.asInt()) ?? 0 }
    #expect(values == [1, 2, 3])
  }

  @Test
  func `does not leak the JS object referenced as an argument`() throws {
    // Regression test for a bug where `JavaScriptValuesBuffer.deinit` deallocated
    // the underlying memory without first running the destructors of the contained
    // `jsi::Value`s, leaking each value's strong ref to its JS object. Calling any
    // JS function via `JavaScriptValuesBuffer` would silently leak its arguments.
    let object = runtime.createObject()
    let weak = object.createWeak()

    // Allocate a buffer that captures the JS object as an argument; the result is
    // discarded and `deinit` runs at the end of this statement. If `deinit` skipped
    // `deinitialize`, the contained `jsi::Value` would still hold a strong ref and
    // the weak handle would survive the collection below.
    _ = JavaScriptValuesBuffer.allocate(in: runtime, with: object.asValue().ref())
    _ = consume object

    runtime.collectGarbage { weak.lock() == nil }

    let stillAlive = weak.lock() != nil
    #expect(stillAlive == false)
  }

  @Test
  func `emplace releases the value it replaces`() throws {
    let object = runtime.createObject()
    let weak = object.createWeak()
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 1)
    try buffer.emplace(object, at: 0, in: runtime)
    try buffer.emplace(42, at: 0, in: runtime)
    runtime.collectGarbage { weak.lock() == nil }
    let stillAlive = weak.lock() != nil
    #expect(stillAlive == false)
    #expect(try buffer[0].asInt() == 42)
  }

  @Test
  func `emplace encodes primitives into the slot`() throws {
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 6)
    try buffer.emplace(true, at: 0, in: runtime)
    try buffer.emplace(42, at: 1, in: runtime)
    try buffer.emplace(1.5, at: 2, in: runtime)
    try buffer.emplace("café", at: 3, in: runtime)
    try buffer.emplace("", at: 4, in: runtime)
    try buffer.emplace(UInt8(7), at: 5, in: runtime)
    #expect(try buffer[0].asBool() == true)
    #expect(try buffer[1].asInt() == 42)
    #expect(try buffer[2].asDouble() == 1.5)
    #expect(try buffer[3].asString() == "café")
    #expect(try buffer[4].asString() == "")
    #expect(try buffer[5].asInt() == 7)
  }

  @Test
  func `emplace encodes optionals into the slot`() throws {
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 2)
    try buffer.emplace(Optional("a"), at: 0, in: runtime)
    try buffer.emplace(Int?.none, at: 1, in: runtime)
    #expect(try buffer[0].asString() == "a")
    let isNull = buffer[1].isNull()
    #expect(isNull)
  }

  @Test
  func `emplace encodes a type without a slot override`() throws {
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 1)
    try buffer.emplace(DefaultEncodedString(string: "default"), at: 0, in: runtime)
    #expect(try buffer[0].asString() == "default")
  }

  @Test
  func `emplace leaves undefined when the encode throws`() throws {
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, capacity: 1)
    try buffer.emplace("replaced", at: 0, in: runtime)
    #expect(throws: UnsafeIntegerException.self) {
      try buffer.emplace(Int.max, at: 0, in: runtime)
    }
    let isUndefined = buffer[0].isUndefined()
    #expect(isUndefined)
    // The slot is still valid to write into after the throw.
    try buffer.emplace(1, at: 0, in: runtime)
    #expect(try buffer[0].asInt() == 1)
  }
}

/// Encodes as a string through the default `encode(_:into:in:)`.
private struct DefaultEncodedString: JavaScriptEncodable {
  let string: String

  static func encode(_ value: DefaultEncodedString, in runtime: borrowing JavaScriptRuntime) throws
    -> JavaScriptValue
  {
    return JavaScriptValue(runtime, value.string)
  }
}

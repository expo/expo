import ExpoModulesJSI
import Testing

@Suite
@JavaScriptActor
struct JavaScriptUnownedValueTests {
  let runtime = JavaScriptRuntime()

  @Test
  func `reads primitives without copying`() {
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: 42, "hello", true)

    // The view is `~Copyable`, so compare accessor results against literals rather than passing the
    // view into `#expect` — the macro captures its operand and would otherwise require `Copyable`.
    let number = buffer.unownedValue(at: 0)
    #expect(number.isNumber() == true)
    #expect(number.getInt() == 42)
    #expect(number.getDouble() == 42)

    let string = buffer.unownedValue(at: 1)
    #expect(string.isString() == true)
    #expect(string.getString() == "hello")

    let bool = buffer.unownedValue(at: 2)
    #expect(bool.isBool() == true)
    #expect(bool.getBool() == true)
  }

  @Test
  func `recognizes null and undefined`() {
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: JavaScriptValue.null, JavaScriptValue.undefined)

    let null = buffer.unownedValue(at: 0)
    #expect(null.isNull() == true)
    #expect(null.isUndefined() == false)

    let undefined = buffer.unownedValue(at: 1)
    #expect(undefined.isUndefined() == true)
    #expect(undefined.isNull() == false)
  }

  @Test
  func `throwing accessors validate the type`() throws {
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: 42, "hello")

    #expect(try buffer.unownedValue(at: 0).asInt() == 42)
    #expect(try buffer.unownedValue(at: 0).asDouble() == 42)
    #expect(try buffer.unownedValue(at: 1).asString() == "hello")

    #expect(throws: JavaScriptValue.TypeError.self) {
      try buffer.unownedValue(at: 0).asString()
    }
    #expect(throws: JavaScriptValue.TypeError.self) {
      try buffer.unownedValue(at: 1).asInt()
    }
    #expect(throws: JavaScriptValue.TypeError.self) {
      try buffer.unownedValue(at: 1).asBool()
    }
  }

  @Test
  func `copied materializes an owning value`() throws {
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: "owned")
    let owning = buffer.unownedValue(at: 0).copied()

    #expect(try owning.asString() == "owned")
  }

  @Test
  func `recognizes objects`() {
    let object = runtime.createObject()
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: object.asValue())

    let view = buffer.unownedValue(at: 0)
    #expect(view.isObject() == true)
    #expect(view.isNumber() == false)
  }
}

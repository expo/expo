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
  func `getString preserves non-ASCII, empty and long strings`() {
    let long = String(repeating: "ą", count: 2000)
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: "żółć 世界 🎉", "", long)
    #expect(buffer.unownedValue(at: 0).getString() == "żółć 世界 🎉")
    #expect(buffer.unownedValue(at: 1).getString() == "")
    #expect(buffer.unownedValue(at: 2).getString() == long)
  }

  @Test
  func `getString leaves the borrowed string intact`() throws {
    let buffer = JavaScriptValuesBuffer.allocate(
      in: runtime,
      with: try runtime.eval("'żółć ' + 'hello'.repeat(2)").ref()
    )
    for _ in 0..<1000 {
      #expect(buffer.unownedValue(at: 0).getString() == "żółć hellohello")
    }
    runtime.collectGarbage()
    #expect(buffer.unownedValue(at: 0).isString() == true)
    #expect(buffer.unownedValue(at: 0).getString() == "żółć hellohello")
  }

  @Test
  func `recognizes null and undefined`() {
    let buffer = JavaScriptValuesBuffer.allocate(
      in: runtime,
      with: JavaScriptValue.null().ref(),
      JavaScriptValue.undefined().ref()
    )

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
    let owning = buffer.unownedValue(at: 0).copied(in: runtime)

    #expect(try owning.asString() == "owned")
  }

  @Test
  func `recognizes objects`() {
    let object = runtime.createObject()
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: object.asValue().ref())

    let view = buffer.unownedValue(at: 0)
    #expect(view.isObject() == true)
    #expect(view.isNumber() == false)
  }

  @Test
  func `asArray(in:) accepts only arrays`() throws {
    let buffer = JavaScriptValuesBuffer.allocate(
      in: runtime,
      with: try runtime.eval("[1, 2]").ref(),
      try runtime.eval("({ length: 2 })").ref()
    )

    #expect(try buffer.unownedValue(at: 0).asArray(in: runtime).length == 2)
    #expect(try buffer.unownedValue(at: 1).asObject(in: runtime).getProperty("length").getInt() == 2)
    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try buffer.unownedValue(at: 1).asArray(in: runtime)
    }
  }

  @Test
  func `recognizes functions, typed arrays and array buffers`() throws {
    let buffer = JavaScriptValuesBuffer.allocate(
      in: runtime,
      with: try runtime.eval("(() => 1)").ref(),
      try runtime.eval("new Uint8Array(4)").ref(),
      try runtime.eval("new ArrayBuffer(8)").ref(),
      try runtime.eval("({})").ref(),
      7
    )
    #expect(buffer.unownedValue(at: 0).isFunction() == true)
    #expect(buffer.unownedValue(at: 1).isTypedArray() == true)
    #expect(buffer.unownedValue(at: 2).isArrayBuffer() == true)

    #expect(buffer.unownedValue(at: 0).isTypedArray() == false)
    #expect(buffer.unownedValue(at: 1).isArrayBuffer() == false)
    #expect(buffer.unownedValue(at: 2).isFunction() == false)
    #expect(buffer.unownedValue(at: 3).isFunction() == false)
    #expect(buffer.unownedValue(at: 3).isTypedArray() == false)
    #expect(buffer.unownedValue(at: 3).isArrayBuffer() == false)
    #expect(buffer.unownedValue(at: 4).isFunction() == false)
    #expect(buffer.unownedValue(at: 4).isTypedArray() == false)
    #expect(buffer.unownedValue(at: 4).isArrayBuffer() == false)
  }

  @Test
  func `getTypedArray and getArrayBuffer read the borrowed object`() throws {
    let buffer = JavaScriptValuesBuffer.allocate(
      in: runtime,
      with: try runtime.eval("new Int16Array([1, 2, 3])").ref(),
      try runtime.eval("new ArrayBuffer(8)").ref()
    )
    let typedArray = buffer.unownedValue(at: 0).getTypedArray(in: runtime)
    #expect(typedArray.kind == .Int16Array)
    #expect(typedArray.length == 3)
    #expect(typedArray.byteLength == 6)

    let arrayBuffer = buffer.unownedValue(at: 1).getArrayBuffer(in: runtime)
    #expect(arrayBuffer.size == 8)
  }

  @Test
  func `getBigInt reads the borrowed BigInt`() throws {
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: try runtime.eval("-9007199254740993n").ref())
    #expect(try buffer.unownedValue(at: 0).getBigInt(in: runtime).asInt64() == -9_007_199_254_740_993)
  }

  @Test
  func `kind matches the kind of the owning value`() throws {
    let sources = ["undefined", "null", "true", "1.5", "10n", "Symbol('s')", "'text'", "(() => 1)", "({})", "[1]"]
    for source in sources {
      let value = try runtime.eval(source)
      let expected = value.kind
      let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: value.ref())
      #expect(buffer.unownedValue(at: 0).kind == expected, "kind of \(source)")
    }
  }
}

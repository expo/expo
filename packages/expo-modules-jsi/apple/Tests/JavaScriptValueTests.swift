import Testing
import ExpoModulesJSI

@Suite
@JavaScriptActor
struct JavaScriptValueTests {
  let runtime = JavaScriptRuntime()

  @Test
  func `create undefined`() {
    #expect(JavaScriptValue.undefined().isUndefined() == true)
    #expect(JavaScriptValue.undefined().isNull() == false)
    #expect(JavaScriptValue.undefined().isNumber() == false)
  }

  @Test
  func `create null`() {
    #expect(JavaScriptValue.null().isNull() == true)
    #expect(JavaScriptValue.null().isUndefined() == false)
    #expect(JavaScriptValue.null().isString() == false)
  }

  @Test
  func `create bool`() {
    let trueValue = JavaScriptValue(runtime, true)
    let falseValue = JavaScriptValue(runtime, false)
    #expect(trueValue.getBool() == true)
    #expect(falseValue.getBool() == false)
  }

  @Test
  func `create number`() {
    let value = JavaScriptValue(runtime, 12.34)
    #expect(value.getInt() == 12)
    #expect(value.getDouble() == 12.34)
  }

  @Test
  func `copy`() {
    let value = JavaScriptValue(runtime, "test")
    let copiedValue = value.copy()
    #expect(copiedValue.getString() == "test")
    #expect((copiedValue == value) == true)
  }

  @Test
  func `toString`() throws {
    #expect(JavaScriptValue(runtime, 20).toString() == "20")
    #expect(runtime.createObject().asValue().toString() == "[object Object]")
    #expect(try runtime.eval("({ toString() { return 'str' }})").toString() == "str")
  }

  @Test
  func `equality`() {
    let number = JavaScriptValue(runtime, 21)
    let string = JavaScriptValue(runtime, "test")
    let null = JavaScriptValue.null()
    let undefined = JavaScriptValue.undefined()
    #expect((number == number) == true)
    #expect((string == string) == true)
    #expect((number == string) == false)
    #expect((number != string) == true)
    #expect((number != null) == true)
    #expect((string == null) == false)
    #expect((null == undefined) == false)
  }

  @Test
  func `equality of runtime-free booleans`() {
    #expect((JavaScriptValue.true() == JavaScriptValue.false()) == false)
    #expect((JavaScriptValue.true() == JavaScriptValue(runtime, true)) == true)
    #expect((JavaScriptValue(runtime, false) != JavaScriptValue.true()) == true)
  }

  @Test
  func `equality of runtime-free numbers`() {
    #expect((JavaScriptValue.number(21) == JavaScriptValue(runtime, 21)) == true)
    #expect((JavaScriptValue.number(10) == JavaScriptValue.number(6)) == false)
    #expect((JavaScriptValue.number(48) == JavaScriptValue.number(48)) == true)
  }

  // MARK: - Type Checking Tests

  @Test
  func `isSymbol for symbol value`() throws {
    let symbol = try runtime.eval("Symbol('test')")
    #expect(symbol.isSymbol() == true)
    #expect(symbol.isString() == false)
    #expect(symbol.isNumber() == false)
  }

  @Test
  func `isSymbol for non-symbol values`() {
    #expect(JavaScriptValue(runtime, "string").isSymbol() == false)
    #expect(JavaScriptValue(runtime, 42).isSymbol() == false)
    #expect(JavaScriptValue.undefined().isSymbol() == false)
  }

  @Test
  func `isTypedArray for typed arrays`() throws {
    let int8Array = try runtime.eval("new Int8Array([1, 2, 3])")
    let uint8Array = try runtime.eval("new Uint8Array([1, 2, 3])")
    let float32Array = try runtime.eval("new Float32Array([1.0, 2.0])")
    #expect(int8Array.isTypedArray() == true)
    #expect(uint8Array.isTypedArray() == true)
    #expect(float32Array.isTypedArray() == true)
  }

  @Test
  func `isTypedArray for non-typed arrays`() throws {
    let regularArray = try runtime.eval("[1, 2, 3]")
    let object = runtime.createObject().asValue()
    #expect(regularArray.isTypedArray() == false)
    #expect(object.isTypedArray() == false)
    #expect(JavaScriptValue(runtime, 42).isTypedArray() == false)
  }

  @Test
  func `is method for Promise`() throws {
    let promise = try runtime.eval("Promise.resolve(42)")
    #expect(promise.is("Promise") == true)
    #expect(promise.is("Array") == false)
    #expect(promise.is("Object") == true)
  }

  @Test
  func `is method for Date`() throws {
    let date = try runtime.eval("new Date()")
    #expect(date.is("Date") == true)
    #expect(date.is("Array") == false)
    #expect(date.is("Promise") == false)
  }

  @Test
  func `is method for Array`() throws {
    let array = try runtime.eval("[1, 2, 3]")
    #expect(array.is("Array") == true)
    #expect(array.is("Date") == false)
  }

  @Test
  func `is method for Error`() throws {
    let error = try runtime.eval("new Error('test')")
    #expect(error.is("Error") == true)
    #expect(error.is("Array") == false)
  }

  @Test
  func `is method for custom class`() throws {
    let instance = try runtime.eval("function MyClass() {}; new MyClass()")
    #expect(instance.is("MyClass") == true)
    #expect(instance.is("Array") == false)
  }

  @Test
  func `is method for non-object values`() {
    let number = JavaScriptValue(runtime, 42)
    let string = JavaScriptValue(runtime, "test")
    #expect(number.is("Number") == false)
    #expect(string.is("String") == false)
  }

  // MARK: - JSON Stringify

  @Test
  func `jsonStringify basic test`() throws {
    let jsonString = "{\"expoSdkVersion\":56}"
    let value = try runtime.eval("(\(jsonString))")
    #expect((try value.jsonStringify() == jsonString) == true)
  }

  @Test
  func `jsonStringify with array replacer`() throws {
    let obj = try runtime.eval("({ name: 'Alice', age: 30, city: 'Paris' })")
    let replacer = try runtime.eval("['name', 'age']")
    let json = try obj.jsonStringify(replacer: replacer)
    #expect(json == "{\"name\":\"Alice\",\"age\":30}")
  }

  @Test
  func `jsonStringify with function replacer`() throws {
    let obj = try runtime.eval("({ a: 1, b: 2, c: 3 })")
    let replacer = try runtime.eval("(key, value) => typeof value === 'number' ? value * 2 : value")
    let json = try obj.jsonStringify(replacer: replacer)
    #expect(json == "{\"a\":2,\"b\":4,\"c\":6}")
  }

  @Test
  func `jsonStringify with space as number`() throws {
    let obj = try runtime.eval("({ name: 'Bob', age: 25 })")
    let space = JavaScriptValue(runtime, 2)
    let json = try obj.jsonStringify(space: space)
    #expect(json?.contains("  \"name\"") == true)
    #expect(json?.contains("  \"age\"") == true)
  }

  @Test
  func `jsonStringify with space as string`() throws {
    let obj = try runtime.eval("({ x: 1, y: 2 })")
    let space = JavaScriptValue(runtime, "  ")
    let json = try obj.jsonStringify(space: space)
    #expect(json?.contains("  \"x\"") == true)
  }

  @Test
  func `jsonStringify with custom space string`() throws {
    let obj = try runtime.eval("({ a: 1 })")
    let space = JavaScriptValue(runtime, "--")
    let json = try obj.jsonStringify(space: space)
    #expect(json?.contains("--\"a\"") == true)
  }

  @Test
  func `jsonStringify returns nil for undefined`() throws {
    let undefined = JavaScriptValue.undefined()
    let json = try undefined.jsonStringify()
    #expect(json == nil)
  }

  @Test
  func `jsonStringify for array`() throws {
    let array = try runtime.eval("[1, 2, 3, 4]")
    let json = try array.jsonStringify()
    #expect(json == "[1,2,3,4]")
  }

  @Test
  func `jsonStringify for nested object`() throws {
    let obj = try runtime.eval("({ person: { name: 'Alice', details: { age: 30 } } })")
    let json = try obj.jsonStringify()
    #expect(json == "{\"person\":{\"name\":\"Alice\",\"details\":{\"age\":30}}}")
  }

  @Test
  func `jsonStringify for string value`() throws {
    let str = JavaScriptValue(runtime, "hello")
    let json = try str.jsonStringify()
    #expect(json == "\"hello\"")
  }

  @Test
  func `jsonStringify for boolean values`() throws {
    let trueVal = JavaScriptValue(runtime, true)
    let falseVal = JavaScriptValue(runtime, false)
    #expect(try trueVal.jsonStringify() == "true")
    #expect(try falseVal.jsonStringify() == "false")
  }

  @Test
  func `jsonStringify for null`() throws {
    let null = JavaScriptValue.null()
    let json = try null.jsonStringify()
    #expect(json == "null")
  }

  @Test
  func `jsonStringify omits functions`() throws {
    let obj = try runtime.eval("({ name: 'Alice', fn: function() {} })")
    let json = try obj.jsonStringify()
    #expect(json == "{\"name\":\"Alice\"}")
  }

  @Test
  func `jsonStringify omits undefined properties`() throws {
    let obj = try runtime.eval("({ a: 1, b: undefined, c: 2 })")
    let json = try obj.jsonStringify()
    #expect(json == "{\"a\":1,\"c\":2}")
  }

  @Test
  func `jsonStringify with both replacer and space`() throws {
    let obj = try runtime.eval("({ name: 'Alice', age: 30, city: 'Paris' })")
    let replacer = try runtime.eval("['name', 'age']")
    let space = JavaScriptValue(runtime, 2)
    let json = try obj.jsonStringify(replacer: replacer, space: space)
    #expect(json?.contains("\"name\"") == true)
    #expect(json?.contains("\"age\"") == true)
    #expect(json?.contains("city") == false)
    #expect(json?.contains("  ") == true)
  }

  // MARK: - as* conversion tests

  @Test
  func `asBool returns Bool for boolean values`() throws {
    let trueValue = JavaScriptValue(runtime, true)
    let falseValue = JavaScriptValue(runtime, false)

    #expect(try trueValue.asBool() == true)
    #expect(try falseValue.asBool() == false)
  }

  @Test
  func `asBool throws TypeError for non-boolean values`() throws {
    let numberValue = JavaScriptValue.number(42)
    let stringValue = try runtime.eval("'hello'")

    #expect(throws: JavaScriptValue.TypeError.self) {
      try numberValue.asBool()
    }
    #expect(throws: JavaScriptValue.TypeError.self) {
      try stringValue.asBool()
    }
  }

  @Test
  func `asInt returns Int for number values`() throws {
    let intValue = try runtime.eval("42")
    let floatValue = try runtime.eval("3.7")

    #expect(try intValue.asInt() == 42)
    #expect(try floatValue.asInt() == 3)
  }

  @Test
  func `asInt throws TypeError for non-number values`() throws {
    let stringValue = try runtime.eval("'123'")
    let boolValue = JavaScriptValue(runtime, true)

    #expect(throws: JavaScriptValue.TypeError.self) {
      try stringValue.asInt()
    }
    #expect(throws: JavaScriptValue.TypeError.self) {
      try boolValue.asInt()
    }
  }

  @Test
  func `asDouble returns Double for number values`() throws {
    let intValue = try runtime.eval("42")
    let floatValue = try runtime.eval("3.14159")

    #expect(try intValue.asDouble() == 42.0)
    #expect(try floatValue.asDouble() == 3.14159)
  }

  @Test
  func `asDouble throws TypeError for non-number values`() throws {
    let stringValue = try runtime.eval("'3.14'")
    let nullValue = JavaScriptValue.null()

    #expect(throws: JavaScriptValue.TypeError.self) {
      try stringValue.asDouble()
    }
    #expect(throws: JavaScriptValue.TypeError.self) {
      try nullValue.asDouble()
    }
  }

  @Test
  func `asString returns String for string values`() throws {
    let stringValue = try runtime.eval("'hello world'")
    let emptyString = try runtime.eval("''")

    #expect(try stringValue.asString() == "hello world")
    #expect(try emptyString.asString() == "")
  }

  @Test
  func `asString throws TypeError for non-string values`() throws {
    let numberValue = JavaScriptValue.number(123)
    let objectValue = try runtime.eval("({ key: 'value' })")

    #expect(throws: JavaScriptValue.TypeError.self) {
      try numberValue.asString()
    }
    #expect(throws: JavaScriptValue.TypeError.self) {
      try objectValue.asString()
    }
  }

  @Test
  func `asObject returns JavaScriptObject for object values`() throws {
    let objectValue = try runtime.eval("({ key: 'value' })")
    let object = try objectValue.asObject()
    #expect(object.getProperty("key").getString() == "value")
  }

  @Test
  func `asObject throws TypeError for non-object values`() throws {
    let numberValue = JavaScriptValue.number(42)
    let stringValue = try runtime.eval("'hello'")

    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try numberValue.asObject()
    }
    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try stringValue.asObject()
    }
  }

  @Test
  func `asArray returns JavaScriptArray for array values`() throws {
    let arrayValue = try runtime.eval("[1, 2, 3]")
    let array = try arrayValue.asArray()
    #expect(array.length == 3)
  }

  @Test
  func `asArray throws TypeError for non-array values`() throws {
    let objectValue = try runtime.eval("({ key: 'value' })")
    let stringValue = try runtime.eval("'[1,2,3]'")

    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try objectValue.asArray()
    }
    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try stringValue.asArray()
    }
  }

  @Test
  func `asFunction returns JavaScriptFunction for function values`() throws {
    let functionValue = try runtime.eval("(x) => x * 2")
    let function = try functionValue.asFunction()
    let result = try function.call(arguments: JavaScriptValue.number(5))
    #expect(result.getDouble() == 10.0)
  }

  @Test
  func `asFunction throws TypeError for non-function values`() throws {
    let objectValue = try runtime.eval("({ key: 'value' })")
    let arrayValue = try runtime.eval("[1, 2, 3]")

    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try objectValue.asFunction()
    }
    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try arrayValue.asFunction()
    }
  }

  @Test
  func `asTypedArray returns JavaScriptTypedArray for typed array values`() throws {
    let typedArrayValue = try runtime.eval("new Uint8Array([1, 2, 3])")
    let typedArray = try typedArrayValue.asTypedArray()
    #expect(typedArray.byteLength == 3)
  }

  @Test
  func `asTypedArray throws TypeError for non-typed-array values`() throws {
    let arrayValue = try runtime.eval("[1, 2, 3]")
    let objectValue = try runtime.eval("({ key: 'value' })")

    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try arrayValue.asTypedArray()
    }
    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try objectValue.asTypedArray()
    }
  }

  @Test
  func `asPromise returns JavaScriptPromise for promise values`() async throws {
    let promiseValue = try runtime.eval("Promise.resolve(42)")
    let promise = try promiseValue.asPromise()
    let result = try await promise.await()
    #expect(result.getDouble() == 42.0)
  }

  @Test
  func `asPromise throws TypeError for non-promise values`() throws {
    let objectValue = try runtime.eval("({ key: 'value' })")
    let numberValue = JavaScriptValue(runtime, 42)

    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try objectValue.asPromise()
    }
    #expect(throws: JavaScriptValue.TypeError.self) {
      _ = try numberValue.asPromise()
    }
  }
}

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
  func `jsonStringify`() throws {
    let jsonString = "{\"expoSdkVersion\":56}"
    let value = try runtime.eval("(\(jsonString))")
    #expect((try value.jsonStringify() == jsonString) == true)
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
}

// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
import ExpoModulesJSI

@Suite
@JavaScriptActor
struct JavaScriptFunctionTests {
  @Test
  func `call function without arguments`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.testFn = function() { return 42; }")

    let fn = runtime.global().getPropertyAsFunction("testFn")
    let result = try fn.call()

    #expect(result.isNumber() == true)
    #expect(result.getInt() == 42)
  }

  @Test
  func `call function with single argument`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.double = function(x) { return x * 2; }")

    let fn = runtime.global().getPropertyAsFunction("double")
    let result = try fn.call(arguments: 21)

    #expect(result.getInt() == 42)
  }

  @Test
  func `call function with multiple arguments`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.sum = function(a, b, c) { return a + b + c; }")

    let fn = runtime.global().getPropertyAsFunction("sum")
    let result = try fn.call(arguments: 10, 20, 12)

    #expect(result.getInt() == 42)
  }

  @Test
  func `call function with this binding`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval(
      "globalThis.getValue = function() { return this.value; };",
      "globalThis.obj = { value: 42 };"
    )

    let fn = runtime.global().getPropertyAsFunction("getValue")
    let obj = runtime.global().getPropertyAsObject("obj")
    let result = try fn.call(this: obj)

    #expect(result.getInt() == 42)
  }

  @Test
  func `call function with this binding and arguments`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval(
      "globalThis.add = function(x) { return this.value + x; };",
      "globalThis.obj = { value: 40 };"
    )

    let fn = runtime.global().getPropertyAsFunction("add")
    let obj = runtime.global().getPropertyAsObject("obj")
    let result = try fn.call(this: obj, arguments: 2)

    #expect(result.getInt() == 42)
  }

  @Test
  func `call function with string arguments`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.concat = function(a, b) { return a + ' ' + b; };")

    let fn = runtime.global().getPropertyAsFunction("concat")
    let result = try fn.call(arguments: "hello", "world")

    #expect(result.getString() == "hello world")
  }

  @Test
  func `call function with mixed type arguments`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.format = function(name, age) { return name + ' is ' + age + ' years old'; };")

    let fn = runtime.global().getPropertyAsFunction("format")
    let result = try fn.call(arguments: "Alice", 30)

    #expect(result.getString() == "Alice is 30 years old")
  }

  @Test
  func `call function that returns object`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.makeObj = function(x) { return { value: x }; };")

    let fn = runtime.global().getPropertyAsFunction("makeObj")
    let result = try fn.call(arguments: 42)

    #expect(result.isObject() == true)
    #expect(result.getObject().getProperty("value").getInt() == 42)
  }

  @Test
  func `call function that returns array`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.makeArray = function(a, b) { return [a, b]; };")

    let fn = runtime.global().getPropertyAsFunction("makeArray")
    let result = try fn.call(arguments: 1, 2)

    #expect(result.isObject() == true)
    let array = result.getArray()
    #expect(array.length == 2)
    #expect(array[0].getInt() == 1)
    #expect(try array.getValue(at: 1).getInt() == 2)
  }

  @Test
  func `call function that throws error`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.throwError = function() { throw new Error('Test error'); };")

    let fn = runtime.global().getPropertyAsFunction("throwError")

    #expect(throws: Error.self) {
      try fn.call()
    }
  }

  @Test
  func `callAsConstructor creates new instance`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.Person = function(name) { this.name = name; };")

    let constructor = runtime.global().getPropertyAsFunction("Person")
    let result = try constructor.callAsConstructor("Alice")

    #expect(result.isObject() == true)
    #expect(result.getObject().getProperty("name").getString() == "Alice")
  }

  @Test
  func `callAsConstructor with multiple arguments`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.Point = function(x, y) { this.x = x; this.y = y; };")

    let constructor = runtime.global().getPropertyAsFunction("Point")
    let result = try constructor.callAsConstructor(10, 20)

    #expect(result.isObject() == true)
    #expect(result.getObject().getProperty("x").getInt() == 10)
    #expect(result.getObject().getProperty("y").getInt() == 20)
  }

  @Test
  func `callAsConstructor without arguments`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.Empty = function() { this.initialized = true; };")

    let constructor = runtime.global().getPropertyAsFunction("Empty")
    let result = try constructor.callAsConstructor()

    #expect(result.isObject() == true)
    #expect(result.getObject().getProperty("initialized").getBool() == true)
  }

  @Test
  func `asValue returns JavaScriptValue`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.testFn = function() { return 1; }")

    let fn = runtime.global().getPropertyAsFunction("testFn")
    let value = fn.asValue()

    #expect(value.isObject() == true)
    #expect(value.isFunction() == true)
  }

  @Test
  func `asObject returns JavaScriptObject`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.testFn = function testFn() { return 1; }")
    let fn = runtime.global().getPropertyAsFunction("testFn")

    // Functions are objects in JavaScript
    #expect(fn.asObject().getProperty("name").getString() == "testFn")
  }

  @Test
  func `function with closure captures variables`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval(
      "globalThis.makeCounter = function() {",
      "  let count = 0;",
      "  return function() {",
      "    return ++count;",
      "  };",
      "};",
      "globalThis.counter = globalThis.makeCounter();"
    )

    let counter = runtime.global().getPropertyAsFunction("counter")

    let result1 = try counter.call()
    #expect(result1.getInt() == 1)

    let result2 = try counter.call()
    #expect(result2.getInt() == 2)

    let result3 = try counter.call()
    #expect(result3.getInt() == 3)
  }

  @Test
  func `function returns undefined when no return statement`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.noReturn = function() { let x = 1 + 1; };")

    let fn = runtime.global().getPropertyAsFunction("noReturn")
    let result = try fn.call()

    #expect(result.isUndefined() == true)
  }

  @Test
  func `arrow function can be called`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.arrow = (x, y) => x + y;")

    let fn = runtime.global().getPropertyAsFunction("arrow")
    let result = try fn.call(arguments: 20, 22)

    #expect(result.getInt() == 42)
  }

  @Test
  func `async function returns promise`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.asyncFn = async function(x) { return x * 2; };")

    let fn = runtime.global().getPropertyAsFunction("asyncFn")
    let result = try fn.call(arguments: 21)

    #expect(result.isObject() == true)
    #expect(result.is("Promise"))
  }

  @Test
  func `JavaScriptRepresentable fromJavaScriptValue converts correctly`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.testFn = function() { return 42; }")

    let value = runtime.global().getProperty("testFn")
    let fn = JavaScriptFunction.fromJavaScriptValue(value)

    #expect(fn.asValue().isFunction() == true)
  }

  @Test
  func `JavaScriptRepresentable toJavaScriptValue converts correctly`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.testFn = function() { return 42; }")

    let fn = runtime.global().getPropertyAsFunction("testFn")
    let value = fn.toJavaScriptValue(in: runtime)

    #expect(value.isFunction() == true)
    #expect(value.isObject() == true)
  }

  @Test
  func `function properties can be accessed`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval(
      "globalThis.myFunction = function namedFn() { return 1; };",
      "globalThis.myFunction.customProp = 'custom';"
    )

    let fn = runtime.global().getPropertyAsFunction("myFunction")
    let obj = fn.asObject()

    // Functions have properties like 'name' and 'length'
    #expect(obj.getProperty("name").getString() == "namedFn")
    #expect(obj.getProperty("customProp").getString() == "custom")
  }

  @Test
  func `call with boolean arguments`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.testBool = function(a, b) { return a && !b; };")

    let fn = runtime.global().getPropertyAsFunction("testBool")
    let result = try fn.call(arguments: true, false)

    #expect(result.getBool() == true)
  }

  @Test
  func `call with null and undefined arguments`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.checkArgs = function(a, b) { return [a === null, b === undefined]; };")

    let fn = runtime.global().getPropertyAsFunction("checkArgs")
    let result = try fn.call(arguments: JavaScriptValue.null(), JavaScriptValue.undefined())
    let array = result.getArray()

    #expect(try array.getValue(at: 0).getBool() == true)
    #expect(array[1].getBool() == true)
  }
}

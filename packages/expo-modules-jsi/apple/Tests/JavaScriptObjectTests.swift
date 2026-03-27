import Testing
import ExpoModulesJSI

@Suite
@JavaScriptActor
struct JavaScriptObjectTests {
  let runtime = JavaScriptRuntime()

  // MARK: - Initialization Tests

  @Test
  func `create new empty object`() {
    let object = JavaScriptObject(runtime)
    #expect(object.asValue().isObject() == true)
  }

  @Test
  func `create object from dictionary with strings`() {
    let dict = ["name": "Alice", "city": "Paris"]
    let object = JavaScriptObject(runtime, dict)
    #expect(object.hasProperty("name") == true)
    #expect(object.hasProperty("city") == true)
    #expect(object.getProperty("name").getString() == "Alice")
    #expect(object.getProperty("city").getString() == "Paris")
  }

  @Test
  func `create object from dictionary with numbers`() {
    let dict = ["age": 25, "score": 100]
    let object = JavaScriptObject(runtime, dict)
    #expect(object.getProperty("age").getInt() == 25)
    #expect(object.getProperty("score").getInt() == 100)
  }

  // MARK: - Property Access Tests

  @Suite("Property Access")
  struct PropertyAccessTests {
    let runtime = JavaScriptRuntime()

    @Test
    func `get undefined property returns undefined`() {
      let object = JavaScriptObject(runtime)
      let value = object.getProperty("nonexistent")
      #expect(value.isUndefined() == true)
    }

    @Test
    func `get built-in property`() {
      let object = JavaScriptObject(runtime)
      let toString = object.getProperty("toString")
      #expect(toString.isFunction() == true)
    }

    @Test
    func `has property initially returns false`() {
      let object = JavaScriptObject(runtime)
      #expect(object.hasProperty("test") == false)
    }

    @Test
    func `has property returns true for built-in`() {
      let object = JavaScriptObject(runtime)
      #expect(object.hasProperty("toString") == true)
      #expect(object.hasProperty("constructor") == true)
    }

    @Test
    func `get property names`() {
      let object = JavaScriptObject(runtime)
      object.setProperty("name", value: "John")
      object.setProperty("age", value: 30.0)
      let names = object.getPropertyNames()
      #expect(names.contains("name") == true)
      #expect(names.contains("age") == true)
    }

    @Test
    func `get property names excludes non-enumerable`() throws {
      let object = JavaScriptObject(runtime)
      object.setProperty("visible", value: "yes")
      object.defineProperty("hidden", descriptor: .init(enumerable: false, value: JavaScriptValue(runtime, "no")))
      let names = object.getPropertyNames()
      #expect(names.contains("visible") == true)
      #expect(names.contains("hidden") == false)
    }

    @Test
    func `get property as object`() {
      let object = JavaScriptObject(runtime)
      let nested = JavaScriptObject(runtime)
      nested.setProperty("inner", value: "value")
      object.setProperty("nested", nested)
      let retrieved = object.getPropertyAsObject("nested")
      #expect(retrieved.getProperty("inner").getString() == "value")
    }

    @Test
    @JavaScriptActor
    func `get property as function`() throws {
      let object = JavaScriptObject(runtime)
      let result = try runtime.eval("(function(x) { return x * 2; })")
      object.setProperty("double", value: result)
      let fn = object.getPropertyAsFunction("double")
      let callResult = try fn.call(arguments: 21)
      #expect(callResult.getInt() == 42)
    }
  }

  // MARK: - Subscript Tests

  @Suite("Subscript")
  @JavaScriptActor
  struct SubscriptTests {
    let runtime = JavaScriptRuntime()

    @Test
    func `subscript with single key`() throws {
      let obj = try runtime.eval("({ name: 'Alice' })")
      let jsObject = obj.getObject()
      let value = jsObject["name"]
      #expect(value.getString() == "Alice")
    }

    @Test
    func `subscript with two nested keys`() throws {
      let obj = try runtime.eval("({ user: { name: 'Bob' } })")
      let jsObject = obj.getObject()
      let value = jsObject["user", "name"]
      #expect(value.getString() == "Bob")
    }

    @Test
    func `subscript with three nested keys`() throws {
      let obj = try runtime.eval("({ data: { user: { age: 25 } } })")
      let jsObject = obj.getObject()
      let value = jsObject["data", "user", "age"]
      #expect(value.getInt() == 25)
    }

    @Test
    func `subscript on manually created object`() {
      let root = runtime.createObject()
      let nested = runtime.createObject()
      nested.setProperty("value", value: 42.0)
      root.setProperty("nested", nested)
      let value = root["nested", "value"]
      #expect(value.getInt() == 42)
    }

    @Test
    func `subscript returns undefined for non-existent property`() throws {
      let obj = try runtime.eval("({ a: 1 })")
      let jsObject = obj.getObject()
      let value = jsObject["nonexistent"]
      #expect(value.isUndefined() == true)
    }

    @Test
    func `nested subscript with mixed types`() throws {
      let obj = try runtime.eval("({ settings: { enabled: true, count: 10 } })")
      let jsObject = obj.getObject()
      let enabled = jsObject["settings", "enabled"]
      let count = jsObject["settings", "count"]
      #expect(enabled.getBool() == true)
      #expect(count.getInt() == 10)
    }
  }

  // MARK: - Property modification tests

  @Suite("Property modification")
  struct PropertyModificationTests {
    let runtime = JavaScriptRuntime()

    @Test
    func `set property with bool`() {
      let object = JavaScriptObject(runtime)
      object.setProperty("isActive", value: true)
      #expect(object.getProperty("isActive").getBool() == true)
      object.setProperty("isActive", value: false)
      #expect(object.getProperty("isActive").getBool() == false)
    }

    @Test
    func `set property with double`() {
      let object = JavaScriptObject(runtime)
      object.setProperty("pi", value: 3.14159)
      #expect(object.getProperty("pi").getDouble() == 3.14159)
    }

    @Test
    func `set property with JavaScriptValue`() {
      let object = JavaScriptObject(runtime)
      let value = JavaScriptValue(runtime, "hello")
      object.setProperty("message", value: value)
      #expect(object.getProperty("message").getString() == "hello")
    }

    @Test
    func `set property with string`() {
      let object = JavaScriptObject(runtime)
      object.setProperty("name", value: "Alice")
      #expect(object.getProperty("name").getString() == "Alice")
    }

    @Test
    func `set property with object`() {
      let object = JavaScriptObject(runtime)
      let nested = JavaScriptObject(runtime)
      nested.setProperty("value", value: 42.0)
      object.setProperty("nested", nested)
      #expect(object.getPropertyAsObject("nested").getProperty("value").getInt() == 42)
    }

    @Test
    func `delete property`() {
      let object = JavaScriptObject(runtime)
      object.setProperty("temp", value: true)
      #expect(object.hasProperty("temp") == true)
      object.deleteProperty("temp")
      #expect(object.hasProperty("temp") == false)
    }

    @Test
    func `delete non-existent property does not error`() {
      let object = JavaScriptObject(runtime)
      object.deleteProperty("nonexistent")
      #expect(object.hasProperty("nonexistent") == false)
    }
  }

  // MARK: - PropertyDescriptor tests

  @Suite("PropertyDescriptor")
  struct PropertyDescriptorTests {
    let runtime = JavaScriptRuntime()

    @Test
    func `define property with default descriptor`() {
      let object = JavaScriptObject(runtime)
      object.defineProperty("test", descriptor: .init(value: JavaScriptValue(runtime, true)))
      #expect(object.hasProperty("test") == true)
      #expect(object.getProperty("test").getBool() == true)
      #expect(object.getPropertyNames().contains("test") == false) // non-enumerable by default
    }

    @Test
    func `define writable property`() {
      let object = JavaScriptObject(runtime)
      object.defineProperty("count", descriptor: .init(writable: true, value: JavaScriptValue(runtime, 0)))
      object.setProperty("count", value: 10.0)
      #expect(object.getProperty("count").getInt() == 10)
    }

    @Test
    func `define enumerable property`() {
      let object = JavaScriptObject(runtime)
      object.defineProperty("visible", descriptor: .init(enumerable: true, value: JavaScriptValue(runtime, "yes")))
      #expect(object.getPropertyNames().contains("visible") == true)
    }

    @Test
    func `define configurable property`() {
      let object = JavaScriptObject(runtime)
      object.defineProperty("test", descriptor: .init(configurable: true, value: JavaScriptValue(runtime, 1)))
      // Should be able to redefine
      object.defineProperty("test", descriptor: .init(enumerable: true, value: JavaScriptValue(runtime, 2)))
      #expect(object.getProperty("test").getInt() == 2)
    }

    @Test
    func `define property with value using convenience method`() {
      let object = JavaScriptObject(runtime)
      object.defineProperty("name", value: "Bob", options: [.enumerable, .writable])
      #expect(object.getProperty("name").getString() == "Bob")
      #expect(object.getPropertyNames().contains("name") == true)
      object.setProperty("name", value: "Alice")
      #expect(object.getProperty("name").getString() == "Alice")
    }

    @Test
    func `define property with all options`() {
      let object = JavaScriptObject(runtime)
      object.defineProperty("fullAccess", value: 100, options: [.configurable, .enumerable, .writable])
      
      #expect(object.getProperty("fullAccess").getInt() == 100)
      #expect(object.getPropertyNames().contains("fullAccess") == true)
      
      // Can modify
      object.setProperty("fullAccess", value: 200.0)
      #expect(object.getProperty("fullAccess").getInt() == 200)
      
      // Can reconfigure
      object.defineProperty("fullAccess", descriptor: .init(value: JavaScriptValue(runtime, 300)))
      #expect(object.getProperty("fullAccess").getInt() == 300)
    }
  }

  // MARK: - Type checking tests

  @Suite("Type checking")
  struct TypeCheckingTests {
    let runtime = JavaScriptRuntime()

    @Test
    @JavaScriptActor
    func `isArray returns true for arrays`() throws {
      let arrayValue = try runtime.eval("[1, 2, 3]")
      let arrayObject = arrayValue.getObject()
      #expect(arrayObject.isArray() == true)
    }

    @Test
    func `isArray returns false for plain objects`() {
      let object = JavaScriptObject(runtime)
      #expect(object.isArray() == false)
    }

    @Test
    @JavaScriptActor
    func `isFunction returns true for functions`() throws {
      let fnValue = try runtime.eval("(function() {})")
      let fnObject = fnValue.getObject()
      #expect(fnObject.isFunction() == true)
    }

    @Test
    func `isFunction returns false for plain objects`() {
      let object = JavaScriptObject(runtime)
      #expect(object.isFunction() == false)
    }

    @Test
    @JavaScriptActor
    func `isArrayBuffer returns true for ArrayBuffer`() throws {
      let bufferValue = try runtime.eval("new ArrayBuffer(16)")
      let bufferObject = bufferValue.getObject()
      #expect(bufferObject.isArrayBuffer() == true)
    }

    @Test
    func `isArrayBuffer returns false for plain objects`() {
      let object = JavaScriptObject(runtime)
      #expect(object.isArrayBuffer() == false)
    }
  }

  // MARK: - Prototype tests

  @Suite("Prototype")
  struct PrototypeTests {
    let runtime = JavaScriptRuntime()

    @Test
    func `get prototype of plain object`() {
      let object = JavaScriptObject(runtime)
      let prototype = object.getPrototype()
      #expect(prototype.isObject() == true)
    }

    @Test
    func `set prototype`() throws {
      let object = JavaScriptObject(runtime)
      let proto = JavaScriptObject(runtime)
      proto.setProperty("protoMethod", value: "exists")
      object.setPrototype(proto.asValue())
      // Should inherit property from prototype
      #expect(object.hasProperty("protoMethod") == true)
      #expect(object.getProperty("protoMethod").getString() == "exists")
    }

    @Test
    @JavaScriptActor
    func `instanceOf with constructor`() throws {
      let arrayInstance = try runtime.eval("[1, 2, 3]")
      let arrayConstructor = try runtime.eval("Array")
      let arrayObject = arrayInstance.getObject()
      #expect(arrayObject.instanceOf(arrayConstructor) == true)
    }

    @Test
    @JavaScriptActor
    func `instanceOf with function`() throws {
      let constructor = try runtime.eval("MyClass = function() {}")
      let instance = try runtime.eval("new MyClass()")
      let instanceObject = instance.getObject()
      let constructorFn = constructor.getFunction()
      #expect(instanceObject.instanceOf(constructorFn) == true)
    }

    @Test
    @JavaScriptActor
    func `instanceOf returns false for non-instance`() throws {
      let plainObject = JavaScriptObject(runtime)
      let arrayConstructor = try runtime.eval("Array")
      #expect(plainObject.instanceOf(arrayConstructor) == false)
    }
  }

  // MARK: - Function calling tests

  @Suite("Function calling")
  struct FunctionCallingTests {
    let runtime = JavaScriptRuntime()

    @Test
    @JavaScriptActor
    func `call function on object`() throws {
      let obj = try runtime.eval("({ double(x) { return x * 2; } })")
      let jsObject = obj.getObject()
      let result = try jsObject.callFunction("double", arguments: 21)
      #expect(result.getInt() == 42)
    }

    @Test
    @JavaScriptActor
    func `call function with multiple arguments`() throws {
      let obj = try runtime.eval("({ add(a, b, c) { return a + b + c; } })")
      let jsObject = obj.getObject()
      let result = try jsObject.callFunction("add", arguments: 10, 20, 30)
      #expect(result.getInt() == 60)
    }

    @Test
    @JavaScriptActor
    func `call function with no arguments`() throws {
      let obj = try runtime.eval("({ getValue() { return 42; } })")
      let jsObject = obj.getObject()
      let result = try jsObject.callFunction("getValue")
      #expect(result.getInt() == 42)
    }

    @Test
    @JavaScriptActor
    func `call function that throws error`() throws {
      let obj = try runtime.eval("({ throwError() { throw new Error('test error'); } })")
      let jsObject = obj.getObject()
      
      #expect(throws: Error.self) {
        try jsObject.callFunction("throwError")
      }
    }
  }

  // MARK: - PropertyOptions tests

  @Suite("PropertyOptions")
  struct PropertyOptionsTests {
    @Test
    func `PropertyOptions option set`() {
      let options: JavaScriptObject.PropertyOptions = [.configurable, .enumerable]
      #expect(options.contains(.configurable) == true)
      #expect(options.contains(.enumerable) == true)
      #expect(options.contains(.writable) == false)
    }

    @Test
    func `PropertyOptions all options`() {
      let options: JavaScriptObject.PropertyOptions = [.configurable, .enumerable, .writable]
      #expect(options.contains(.configurable) == true)
      #expect(options.contains(.enumerable) == true)
      #expect(options.contains(.writable) == true)
    }

    @Test
    func `PropertyOptions empty`() {
      let options: JavaScriptObject.PropertyOptions = []
      #expect(options.contains(.configurable) == false)
      #expect(options.contains(.enumerable) == false)
      #expect(options.contains(.writable) == false)
    }
  }

  // MARK: - PropertyDescriptor tests

  @Suite("PropertyDescriptor")
  struct PropertyDescriptorStructTests {
    let runtime = JavaScriptRuntime()

    @Test
    func `PropertyDescriptor default initialization`() {
      let descriptor = JavaScriptObject.PropertyDescriptor()
      let object = descriptor.toObject(runtime)
      // With default values, all boolean properties should be false/absent
      #expect(object.hasProperty("configurable") == false)
      #expect(object.hasProperty("enumerable") == false)
      #expect(object.hasProperty("writable") == false)
      #expect(object.hasProperty("value") == false)
    }

    @Test
    func `PropertyDescriptor with all properties`() {
      let value = JavaScriptValue(runtime, "test")
      let descriptor = JavaScriptObject.PropertyDescriptor(configurable: true, enumerable: true, writable: true, value: value)
      let object = descriptor.toObject(runtime)
      #expect(object.hasProperty("configurable") == true)
      #expect(object.getProperty("configurable").getBool() == true)
      #expect(object.hasProperty("enumerable") == true)
      #expect(object.getProperty("enumerable").getBool() == true)
      #expect(object.hasProperty("writable") == true)
      #expect(object.getProperty("writable").getBool() == true)
      #expect(object.hasProperty("value") == true)
      #expect(object.getProperty("value").getString() == "test")
    }

    @Test
    func `PropertyDescriptor to object conversion`() {
      let descriptor = JavaScriptObject.PropertyDescriptor(configurable: false, enumerable: true, writable: false, value: JavaScriptValue(runtime, 42))
      let object = descriptor.toObject(runtime)
      #expect(object.getProperty("enumerable").getBool() == true)
      #expect(object.getProperty("value").getInt() == 42)
    }
  }
}

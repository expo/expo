// Copyright 2025-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesJSI

@Suite
struct JSObjectTests {
  let runtime = JavaScriptRuntime()

  @Test
  func `create new object`() {
    let _ = JavaScriptObject(runtime)
  }

  @Test
  func `creates new object from dictionary`() {
    let dict = ["test": "hello"]
    let object = JavaScriptObject(runtime, dict)
    #expect(object.getPropertyNames().contains("test") == true)
    #expect(object.getProperty("test").getString() == dict["test"])
  }

  @Suite
  struct `getProperty` {
    let runtime = JavaScriptRuntime()

    @Test
    func `gets undefined property`() {
      let object = JavaScriptObject(runtime)
      let value = object.getProperty("test")
      #expect(value.isUndefined() == true)
    }

    @Test
    func `gets built-in property`() {
      let object = JavaScriptObject(runtime)
      let value = object.getProperty("toString")
      #expect(value.isFunction() == true)
    }
  }

  @Test
  func `set property`() {
    let object = JavaScriptObject(runtime)
    object.setProperty("test", true)
    #expect(object.getProperty("test").getBool() == true)
  }

  @Suite
  struct `hasProperty` {
    let runtime = JavaScriptRuntime()

    @Test
    func `initially false`() {
      let object = JavaScriptObject(runtime)
      #expect(object.hasProperty("test") == false)
    }

    @Test
    func `true for built-in property`() {
      let object = JavaScriptObject(runtime)
      #expect(object.hasProperty("toString") == true)
    }

    @Test
    func `true after setting`() {
      let object = JavaScriptObject(runtime)
      object.setProperty("test", 2)
      #expect(object.hasProperty("test") == true)
    }

    @Test
    func `true after setting to undefined`() {
      let object = JavaScriptObject(runtime)
      object.setProperty("test", .undefined)
      #expect(object.hasProperty("test") == true)
    }

    @Test
    func `false after deleting`() {
      let object = JavaScriptObject(runtime)
      object.setProperty("test", true)
      object.deleteProperty("test")
      #expect(object.hasProperty("test") == false)
    }

    @Test
    func `true after defining property`() {
      var object = JavaScriptObject(runtime)
      object.defineProperty("test", descriptor: .init(value: .false))
      #expect(object.hasProperty("test") == true)
    }

    @Test
    func `true for non-enumerable property`() {
      var object = JavaScriptObject(runtime)
      object.defineProperty("test", descriptor: .init(enumerable: false))
      #expect(object.hasProperty("test") == true)
    }
  }

  @Suite
  struct `defineProperty` {
    let runtime = JavaScriptRuntime()

    @Test
    func `defines with default descriptor`() {
      // non-configurable, non-enumerable, non-writable
      // TODO: checkWritable and checkConfigurable would throw C++ exception that we are not able to catch yet
      var object = JavaScriptObject(runtime)
      object.defineProperty("test", descriptor: .init(value: .true))
      #expect(object.getProperty("test").getBool() == true)
      // #expect(checkWritable(object) == false)
      #expect(checkEnumerable(object) == false)
      // #expect(checkConfigurable(&object) == false)
    }

    @Test
    func `defines writable value`() {
      // non-configurable, non-enumerable, writable
      var object = JavaScriptObject(runtime)
      object.defineProperty("test", descriptor: .init(writable: true))
      #expect(checkWritable(object) == true)
    }

    @Test
    func `defines enumerable value`() {
      // non-configurable, enumerable, non-writable
      var object = JavaScriptObject(runtime)
      object.defineProperty("test", descriptor: .init(enumerable: true))
      #expect(checkEnumerable(object) == true)
    }

    @Test
    func `defines configurable value`() {
      // configurable, non-enumerable, non-writable
      var object = JavaScriptObject(runtime)
      object.defineProperty("test", descriptor: .init(configurable: true))
      #expect(checkConfigurable(&object) == true)
    }

    private func checkConfigurable(_ object: inout JavaScriptObject) -> Bool {
      // Toggle enumerable option and check if it actually changed
      let wasEnumerable = checkEnumerable(object)
      object.defineProperty("test", descriptor: .init(enumerable: !wasEnumerable))
      return checkEnumerable(object) == !wasEnumerable
    }

    private func checkEnumerable(_ object: borrowing JavaScriptObject) -> Bool {
      // If a property is enumerable, it should be included in its own property names
      return object.getPropertyNames().contains("test")
    }

    private func checkWritable(_ object: borrowing JavaScriptObject) -> Bool {
      let randomValue = Double.random(in: 1..<100)
      object.setProperty("test", randomValue)
      let value = object.getProperty("test")
      return value.isNumber() && value.getDouble() == randomValue
    }
  }
}

// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("ClassDefinition")
struct ClassDefinitionTests {
  // MARK: - Basic

  @Suite("basic")
  struct BasicTests {
    @Test
    func `factory returns a definition`() {
      let klass = Class("") {}
      #expect(klass is ClassDefinition)
    }

    @Test
    func `has a name`() {
      let expoClassName = "ExpoClass"
      let klass = Class(expoClassName) {}
      #expect(klass.name == expoClassName)
    }

    @Test
    func `is without native constructor`() {
      let klass = Class("") {}
      #expect(klass.constructor == nil)
    }

    @Test
    func `has native constructor`() {
      let klass = Class("") { Constructor {} }
      #expect(klass.constructor != nil)
    }

    @Test
    func `ignores constructor as function`() {
      let klass = Class("") { Constructor {} }
      #expect(klass.functions["constructor"] == nil)
    }

    @Test
    func `builds a class`() throws {
      try JavaScriptActor.assumeIsolated {
        let appContext = AppContext.create()
        let klass = Class("") {}
        let object = try klass.build(appContext: appContext)

        #expect(object.hasProperty("prototype") == true)
        #expect(object.getProperty("prototype").kind == .object)
      }
    }
  }

  // MARK: - Module

  @Suite("module")
  struct ModuleTests {
    let appContext: AppContext
    var runtime: ExpoRuntime {
      get throws {
        try appContext.runtime
      }
    }

    init() {
      appContext = AppContext.create()

      class ClassTestModule: Module {
        func definition() -> ModuleDefinition {
          Name("ClassTest")

          Class("MyClass") {
            Constructor {}

            Function("myFunction") {
              return "foobar"
            }

            Property("foo") {
              return "bar"
            }
          }
        }
      }
      appContext.moduleRegistry.register(moduleType: ClassTestModule.self, name: "ClassTest")
    }

    @Test
    func `is a function`() throws {
      let klass = try runtime.eval("expo.modules.ClassTest.MyClass")
      #expect(klass.isFunction() == true)
    }

    @Test
    func `has a name`() throws {
      let klass = try runtime.eval("expo.modules.ClassTest.MyClass.name")
      #expect(klass.getString() == "MyClass")
    }

    @Test
    func `has a prototype`() throws {
      let prototype = try runtime.eval("expo.modules.ClassTest.MyClass.prototype")
      #expect(prototype.isObject() == true)
    }

    @Test
    func `has keys in prototype`() throws {
      let prototypeKeys = try runtime.eval("Object.keys(expo.modules.ClassTest.MyClass.prototype)")
        .getArray()
        .map { $0.getString() }

      #expect(prototypeKeys.contains("myFunction"))
      #expect(!prototypeKeys.contains("__native_constructor__"))
    }

    @Test
    func `is an instance of`() throws {
      let isInstanceOf = try runtime.eval([
        "myObject = new expo.modules.ClassTest.MyClass()",
        "myObject instanceof expo.modules.ClassTest.MyClass",
      ])

      #expect(isInstanceOf.getBool() == true)
    }

    @Test
    func `defines properties on initialization`() throws {
      // The properties are not specified in the prototype, but defined during initialization.
      let object = try runtime.eval("new expo.modules.ClassTest.MyClass()").asObject()
      #expect(object.getPropertyNames().contains("foo"))
      #expect(object.getProperty("foo").getString() == "bar")
    }
  }

  // MARK: - Class with associated type

  @Suite("class with associated type")
  struct ClassWithAssociatedTypeTests {
    let appContext: AppContext
    var runtime: ExpoRuntime {
      get throws {
        try appContext.runtime
      }
    }

    init() {
      appContext = AppContext.create()
      appContext.moduleRegistry.register(moduleType: ModuleWithCounterClass.self, name: "TestModule")
    }

    @Test
    func `is defined`() throws {
      let isDefined = try runtime.eval("'Counter' in expo.modules.TestModule")
      #expect(isDefined.getBool() == true)
    }

    @Test
    func `creates shared object`() throws {
      let jsObject = try runtime.eval("new expo.modules.TestModule.Counter(0)").getObject()
      let nativeObject = appContext.sharedObjectRegistry.toNativeObject(jsObject)
      #expect(nativeObject != nil)
    }

    @Test
    func `registers shared object`() throws {
      let oldSize = appContext.sharedObjectRegistry.size
      try runtime.eval("object = new expo.modules.TestModule.Counter(0)")
      #expect(appContext.sharedObjectRegistry.size == oldSize + 1)
    }

    @Test
    func `calls function with owner`() throws {
      try runtime.eval([
        "object = new expo.modules.TestModule.Counter(0)",
        "object.increment(1)",
      ])
      // no expectations, just checking if it doesn't fail
    }

    @Test
    func `creates with initial value`() throws {
      let initialValue = Int.random(in: 1..<100)
      let value = try runtime.eval([
        "object = new expo.modules.TestModule.Counter(\(initialValue))",
        "object.getValue()",
      ])

      #expect(value.kind == .number)
      #expect(value.getInt() == initialValue)
    }

    @Test
    func `gets shared object value`() throws {
      let value = try runtime.eval([
        "object = new expo.modules.TestModule.Counter(0)",
        "object.getValue()",
      ])

      #expect(value.kind == .number)
      #expect(value.isNumber() == true)
    }

    @Test
    func `changes shared object`() throws {
      try runtime.eval("object = new expo.modules.TestModule.Counter(0)")
      let incrementBy = Int.random(in: 1..<100)
      let value = try runtime.eval("object.getValue()").asInt()
      let newValue = try runtime.eval([
        "object.increment(\(incrementBy))",
        "object.getValue()",
      ])

      #expect(newValue.kind == .number)
      #expect(newValue.getInt() == value + incrementBy)
    }

    @Test
    func `gets value from the dynamic property`() throws {
      let initialValue = Int.random(in: 1..<100)
      let value = try runtime.eval([
        "object = new expo.modules.TestModule.Counter(\(initialValue))",
        "object.currentValue"
      ])

      #expect(value.kind == .number)
      #expect(value.getInt() == initialValue)
    }

    @Test
    func `initializes the shared object from native`() throws {
      let initialValue = Int.random(in: 1..<100)
      let value = try runtime.eval("expo.modules.TestModule.newCounter(\(initialValue))")

      #expect(value.kind == .object)
      #expect(value.getObject().getProperty("currentValue").getInt() == initialValue)
    }

    @Test
    func `initializes the shared object from static function`() throws {
      let initialValue = Int.random(in: 1..<100)
      let value = try runtime.eval("expo.modules.TestModule.Counter.create(\(initialValue))")

      #expect(value.kind == .object)
      #expect(value.getObject().getProperty("currentValue").getInt() == initialValue)
    }

    @Test
    func `initializes the shared object from static async function`() async throws {
      let initialValue = Int.random(in: 1..<100)
      try runtime
        .eval(
          "expo.modules.TestModule.Counter.createAsync(\(initialValue)).then((result) => { globalThis.result = result; })"
        )

      try await waitUntil(timeout: 4.0) {
        safeBoolEval("globalThis.result != null")
      }
      let object = try runtime.eval("object = globalThis.result")

      #expect(object.kind == .object)
      #expect(object.getObject().getProperty("currentValue").getInt() == initialValue)
    }

    private func safeBoolEval(_ js: String) -> Bool {
      var result = false
      do {
        try EXUtilities.catchException {
          guard let jsResult = try? self.runtime.eval(js) else {
            return
          }
          result = jsResult.getBool()
        }
      } catch {
        return false
      }
      return result
    }

    private func waitUntil(timeout: TimeInterval, condition: @escaping () -> Bool) async throws {
      let start = Date()
      while !condition() {
        if Date().timeIntervalSince(start) > timeout {
          throw TestError.timeout
        }
        try await Task.sleep(nanoseconds: 50_000_000) // 50ms
      }
    }
  }

  // MARK: - Constructor error handling

  @Suite("constructor error handling")
  struct ConstructorErrorHandlingTests {
    let appContext: AppContext
    var runtime: ExpoRuntime {
      get throws {
        try appContext.runtime
      }
    }

    init() {
      appContext = AppContext.create()

      class ErrorTestModule: Module {
        func definition() -> ModuleDefinition {
          Name("ErrorTest")

          Class("FailingClass") {
            Constructor { (shouldFail: Bool) in
              if shouldFail {
                throw TestCodedException()
              }
              return Counter(initialValue: 0)
            }

            Function("test") {
              return "success"
            }
          }
        }
      }
      appContext.moduleRegistry.register(moduleType: ErrorTestModule.self, name: "ErrorTest")
    }

    @Test
    func `exceptions are in the correct format`() throws {
      #expect {
        try runtime.eval("new expo.modules.ErrorTest.FailingClass(true)")
      } throws: { error in
        guard let evalError = error as? JavaScriptEvalException else {
          return false
        }
        let reason = evalError.param.userInfo["message"] as? String ?? ""
        return reason.contains("Calling the 'constructor' function has failed") &&
               reason.contains("→ Caused by:") &&
               reason.contains("This is a test Exception with a code")
      }
    }

    @Test
    func `check error codes from coded exceptions`() throws {
      let errorCode = try runtime.eval([
        "try { new expo.modules.ErrorTest.FailingClass(true) } catch (error) { error.code }"
      ]).getString()
      #expect(errorCode == "E_TEST_CODE")
    }

    @Test
    func `succeeds when constructor does not throw`() throws {
      let result = try runtime.eval("new expo.modules.ErrorTest.FailingClass(false)")
      #expect(result.kind == .object)
      #expect(result.getObject().hasProperty("test") == true)
    }

    @Test
    func `can call methods on successfully constructed objects`() throws {
      let result = try runtime.eval([
        "obj = new expo.modules.ErrorTest.FailingClass(false)",
        "obj.test()"
      ])
      #expect(result.getString() == "success")
    }
  }
}

private enum TestError: Error {
  case timeout
}

/**
 A module that exposes a Counter class with an associated shared object class.
 */
fileprivate final class ModuleWithCounterClass: Module {
  func definition() -> ModuleDefinition {
    Name("TestModule")

    Function("newCounter") { (initialValue: Int) in
      return Counter(initialValue: initialValue)
    }

    Class(Counter.self) {
      Constructor { (initialValue: Int) in
        return Counter(initialValue: initialValue)
      }

      StaticFunction("create") { (initialValue: Int) in
        return Counter(initialValue: initialValue)
      }

      StaticAsyncFunction("createAsync") { (initialValue: Int, p: Promise) in
        p.resolve(Counter(initialValue: initialValue))
      }

      Function("increment") { (counter, value: Int) in
        counter.increment(by: value)
      }
      Function("getValue") { counter in
        return counter.currentValue
      }

      Property("currentValue") { counter in
        return counter.currentValue
      }
    }
  }
}

/**
 A shared object class that stores some native value and can be used as an associated type of the JS class.
 */
fileprivate final class Counter: SharedObject {
  var currentValue = 0

  init(initialValue: Int = 0) {
    self.currentValue = initialValue
  }

  func increment(by value: Int = 1) {
    currentValue += value
  }
}

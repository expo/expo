import Testing

@testable import ExpoModulesCore

@Suite("PropertyDefinition")
struct PropertyDefinitionTests {
  @Suite("module property", .serialized)
  @JavaScriptActor
  struct ModulePropertyTests {
    let appContext: AppContext
    let runtime: ExpoRuntime

    init() throws {
      appContext = AppContext.create()
      runtime = try appContext.runtime
      appContext.moduleRegistry.register(moduleType: PropertyTestModule.self, name: "PropertyTest")
    }

    @Test
    func `gets read-only property`() throws {
      let value = try runtime.eval("expo.modules.PropertyTest.readOnly")
      #expect(value.getString() == "foo")
    }

    @Test
    func `gets writable property`() throws {
      let value = try runtime.eval("expo.modules.PropertyTest.writable")
      #expect(value.getInt() == 444)
    }

    @Test
    func `sets writable property`() throws {
      try runtime.eval("expo.modules.PropertyTest.writable = 777")
      let value = try runtime.eval("expo.modules.PropertyTest.writable")
      #expect(value.getInt() == 777)
    }

    @Test
    func `is enumerable`() throws {
      let keys = try runtime.eval("Object.keys(expo.modules.PropertyTest)").getArray().map { $0.getString() }
      #expect(keys.contains("readOnly") && keys.contains("writable") && keys.contains("undefined"))
    }

// TODO: Using JavaScriptObject as the owner is no longer possible, but we may want to bring this feature back
//    @Test
//    func `is called with the caller`() throws {
//      let value = try runtime.eval("expo.modules.PropertyTest.withCaller")
//      #expect(value.getString() == "foo")
//    }

    @Test
    func `returns undefined when getter is not specified`() throws {
      let value = try runtime.eval("expo.modules.PropertyTest.undefined")
      #expect(value.isUndefined() == true)
    }
  }

  @Suite("class property", .serialized)
  @JavaScriptActor
  struct ClassPropertyTests {
    let appContext: AppContext
    let runtime: ExpoRuntime

    init() throws {
      appContext = AppContext.create()
      runtime = try appContext.runtime
      appContext.moduleRegistry.register(moduleType: PropertyTestModule.self, name: "PropertyTest")
    }

    @Test
    func `gets the value`() throws {
      let value = try runtime.eval("new expo.modules.PropertyTest.TestClass().someValue")

      #expect(value.kind == .number)
      #expect(value.getInt() == TestClass.constantValue)
    }

    @Test
    func `sets the value`() throws {
      let newValue = Int.random(in: 1..<100)
      let value = try runtime.eval([
        "object = new expo.modules.PropertyTest.TestClass()",
        "object.someValue = \(newValue)",
        "object.someValue"
      ])

      #expect(value.kind == .number)
      #expect(value.getInt() == newValue)
    }

    // Tests for accessing shared object properties through KeyPath and ReferenceWritableKeyPath
    @Suite("key path", .serialized)
    @JavaScriptActor
    struct KeyPathTests {
      let appContext: AppContext
      let runtime: ExpoRuntime

      init() throws {
        appContext = AppContext.create()
        runtime = try appContext.runtime
        appContext.moduleRegistry.register(moduleType: PropertyTestModule.self, name: "PropertyTest")
      }

      @Test
      func `gets immutable property`() throws {
        let value = try runtime.eval([
          "object = new expo.modules.PropertyTest.TestClass()",
          "object.immutableKeyPathProperty"
        ])

        #expect(value.kind == .number)
        #expect(value.getInt() == TestClass.constantValue)
      }

      @Test
      func `cannot set immutable property`() throws {
        let newValue = Int.random(in: 100..<200)
        let value = try runtime.eval([
          "object = new expo.modules.PropertyTest.TestClass()",
          "object.immutableKeyPathProperty = \(newValue)",
          "object.immutableKeyPathProperty"
        ])

        // Returned value didn't change, it doesn't equal to `newValue`
        #expect(value.kind == .number)
        #expect(value.getInt() == TestClass.constantValue)
      }

      @Test
      func `sets mutable property`() throws {
        let newValue = Int.random(in: 100..<200)
        let value = try runtime.eval([
          "object = new expo.modules.PropertyTest.TestClass()",
          "object.mutableKeyPathProperty = \(newValue)",
          "object.mutableKeyPathProperty"
        ])

        #expect(value.kind == .number)
        #expect(value.getInt() == newValue)
      }
    }
  }
}

class PropertyTestModule: Module {
  func definition() -> ModuleDefinition {
    Name("PropertyTest")

    Property("readOnly") {
      return "foo"
    }

    var writablePropertyValue = 444
    Property("writable")
      .get {
        return writablePropertyValue
      }
      .set { value in
        writablePropertyValue = value
      }

// TODO: Using JavaScriptObject as the owner is no longer possible, but we may want to bring this feature back
//            Property("withCaller") { (caller: JavaScriptObject) -> String in
//              // Here, the caller is a JS object of the module.
//              // Return another property of itself.
//              return caller.getProperty("readOnly").getString()
//            }

    Property("undefined")

    Class(TestClass.self) {
      Constructor {
        return TestClass()
      }

      Property("someValue") { object in
        return object.someValue
      }
      .set { object, newValue in
        object.someValue = newValue
      }

      // KeyPath<TestClass, Int>
      Property("immutableKeyPathProperty", \.immutableKeyPathProperty)

      // ReferenceWritableKeyPath<TestClass, Int>
      Property("mutableKeyPathProperty", \.mutableKeyPathProperty)
    }
  }
}

fileprivate final class TestClass: SharedObject {
  static let constantValue = Int.random(in: 1..<100)

  var someValue = TestClass.constantValue

  // For "key path" tests
  let immutableKeyPathProperty = TestClass.constantValue
  var mutableKeyPathProperty = TestClass.constantValue
}

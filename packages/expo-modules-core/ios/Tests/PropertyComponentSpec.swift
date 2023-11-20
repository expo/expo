import ExpoModulesTestCore

@testable import ExpoModulesCore

class PropertyComponentSpec: ExpoSpec {
  override class func spec() {
    describe("property") {
      let appContext = AppContext.create()
      let runtime = try! appContext.runtime

      it("gets the value") {
        let property = Property("test") { return "expo" }
        expect(try property.getValue(appContext: appContext)) == "expo"
      }

      it("sets the value") {
        var value = Int.random(in: 0..<100)
        let property = Property("test")
          .get { value }
          .set { (newValue: Int) in
            value = newValue
          }

        let newValue = Int.random(in: 0..<100)
        property.setValue(newValue, appContext: appContext)

        expect(try property.getValue(appContext: appContext)) == value
        expect(value) == newValue
      }
    }

    describe("module property") {
      let appContext = AppContext.create()
      let runtime = try! appContext.runtime

      beforeSuite {
        appContext.moduleRegistry.register(moduleType: PropertyTestModule.self)
      }

      it("gets read-only property") {
        let value = try runtime.eval("expo.modules.PropertyTest.readOnly")
        expect(value.getString()) == "foo"
      }

      it("gets writable property") {
        let value = try runtime.eval("expo.modules.PropertyTest.writable")
        expect(value.getInt()) == 444
      }

      it("sets writable property") {
        try runtime.eval("expo.modules.PropertyTest.writable = 777")
        let value = try runtime.eval("expo.modules.PropertyTest.writable")
        expect(value.getInt()) == 777
      }

      it("is enumerable") {
        let keys = try runtime.eval("Object.keys(expo.modules.PropertyTest)").getArray().map { $0.getString() } ?? []
        expect(keys).to(contain("readOnly", "writable", "undefined"))
      }

// TODO: Using JavaScriptObject as the owner is no longer possible, but we may want to bring this feature back
//      it("is called with the caller") {
//        let value = try runtime?.eval("expo.modules.PropertyTest.withCaller")
//        expect(value?.getString()) == "foo"
//      }

      it("returns undefined when getter is not specified") {
        let value = try runtime.eval("expo.modules.PropertyTest.undefined")
        expect(value.isUndefined()) == true
      }
    }

    describe("class property") {
      let appContext = AppContext.create()
      let runtime = try! appContext.runtime

      beforeSuite {
        appContext.moduleRegistry.register(moduleType: PropertyTestModule.self)
      }

      it("gets the value") {
        let value = try runtime.eval("new expo.modules.PropertyTest.TestClass().someValue")

        expect(value.kind) == .number
        expect(value.getInt()) == TestClass.constantValue
      }

      it("sets the value") {
        let newValue = Int.random(in: 1..<100)
        let value = try runtime.eval([
          "object = new expo.modules.PropertyTest.TestClass()",
          "object.someValue = \(newValue)",
          "object.someValue"
        ])

        expect(value.kind) == .number
        expect(value.getInt()) == newValue
      }

      // Tests for accessing shared object properties through KeyPath and ReferenceWritableKeyPath
      describe("key path") {
        it("gets immutable property") {
          let value = try runtime.eval([
            "object = new expo.modules.PropertyTest.TestClass()",
            "object.immutableKeyPathProperty"
          ])

          expect(value.kind) == .number
          expect(value.getInt()) == TestClass.constantValue
        }

        it("cannot set immutable property") {
          let newValue = Int.random(in: 100..<200)
          let value = try runtime.eval([
            "object = new expo.modules.PropertyTest.TestClass()",
            "object.immutableKeyPathProperty = \(newValue)",
            "object.immutableKeyPathProperty"
          ])

          // Returned value didn't change, it doesn't equal to `newValue`
          expect(value.kind) == .number
          expect(value.getInt()) == TestClass.constantValue
        }

        it("sets mutable property") {
          let newValue = Int.random(in: 100..<200)
          let value = try runtime.eval([
            "object = new expo.modules.PropertyTest.TestClass()",
            "object.mutableKeyPathProperty = \(newValue)",
            "object.mutableKeyPathProperty"
          ])

          expect(value.kind) == .number
          expect(value.getInt()) == newValue
        }
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

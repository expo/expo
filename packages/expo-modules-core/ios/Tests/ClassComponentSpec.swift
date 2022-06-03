import ExpoModulesTestCore

@testable import ExpoModulesCore

class ClassComponentSpec: ExpoSpec {
  override func spec() {
    describe("basic") {
      it("factory returns a component") {
        let klass = Class("") {}
        expect(klass).to(beAnInstanceOf(ClassComponent.self))
      }

      it("has a name") {
        let expoClassName = "ExpoClass"
        let klass = Class(expoClassName) {}
        expect(klass.name) == expoClassName
      }

      it("is without native constructor") {
        let klass = Class("") {}
        expect(klass.constructor).to(beNil())
      }

      it("has native constructor") {
        let klass = Class("") { Constructor {} }
        expect(klass.constructor).notTo(beNil())
      }

      it("ignores constructor as function") {
        let klass = Class("") { Constructor {} }
        expect(klass.functions["constructor"]).to(beNil())
      }

      it("builds a class") {
        let runtime = JavaScriptRuntime()
        let klass = Class("") {}
        let object = klass.build(inRuntime: runtime)

        expect(object.hasProperty("prototype")) == true
        expect(object.getProperty("prototype").kind) == .object
      }
    }

    describe("module") {
      let appContext = AppContext.create()
      let runtime = appContext.runtime

      beforeSuite {
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
        appContext.moduleRegistry.register(moduleType: ClassTestModule.self)
      }

      it("is a function") {
        let klass = try runtime?.eval("ExpoModules.ClassTest.MyClass")
        expect(klass?.isFunction()) == true
      }

      it("has a name") {
        let klass = try runtime?.eval("ExpoModules.ClassTest.MyClass.name")
        expect(klass?.getString()) == "MyClass"
      }

      it("has a prototype") {
        let prototype = try runtime?.eval("ExpoModules.ClassTest.MyClass.prototype")
        expect(prototype?.isObject()) == true
      }

      it("has keys in prototype") {
        let prototypeKeys = try runtime?.eval("Object.keys(ExpoModules.ClassTest.MyClass.prototype)")
          .getArray()
          .map { $0.getString() } ?? []

        expect(prototypeKeys).to(contain("myFunction"))
        expect(prototypeKeys).notTo(contain("__native_constructor__"))
      }

      it("is an instance of") {
        let isInstanceOf = try runtime?.eval([
          "myObject = new ExpoModules.ClassTest.MyClass()",
          "myObject instanceof ExpoModules.ClassTest.MyClass",
        ])

        expect(isInstanceOf?.getBool()) == true
      }

      it("defines properties on initialization") {
        // The properties are not specified in the prototype, but defined during initialization.
        let object = try runtime?.eval("new ExpoModules.ClassTest.MyClass()").asObject()
        expect(object?.getPropertyNames()).to(contain("foo"))
        expect(object?.getProperty("foo").getString()) == "bar"
      }
    }

    describe("class with associated type") {
      let appContext = AppContext.create()
      let runtime = appContext.runtime

      beforeSuite {
        appContext.moduleRegistry.register(moduleType: ModuleWithCounterClass.self)
      }
      it("is defined") {
        let isDefined = try! runtime!.eval("'Counter' in ExpoModules.TestModule")

        expect(isDefined.getBool()) == true
      }
      it("creates shared object") {
        let jsObject = try! runtime!.eval("new ExpoModules.TestModule.Counter(0)").getObject()
        let nativeObject = SharedObjectRegistry.toNativeObject(jsObject)

        expect(nativeObject).notTo(beNil())
      }
      it("registers shared object") {
        let oldSize = SharedObjectRegistry.size
        try! runtime?.eval("object = new ExpoModules.TestModule.Counter(0)")

        expect(SharedObjectRegistry.size) == oldSize + 1
      }
      it("calls function with owner") {
        try runtime?.eval([
          "object = new ExpoModules.TestModule.Counter(0)",
          "object.increment(1)",
        ])
        // no expectations, just checking if it doesn't fail
      }
      it("creates with initial value") {
        let initialValue = Int.random(in: 1..<100)
        let value = try runtime!.eval([
          "object = new ExpoModules.TestModule.Counter(\(initialValue))",
          "object.getValue()",
        ])

        expect(value.kind) == .number
        expect(value.getInt()) == initialValue
      }
      it("gets shared object value") {
        let value = try runtime!.eval([
          "object = new ExpoModules.TestModule.Counter(0)",
          "object.getValue()",
        ])

        expect(value.kind) == .number
        expect(value.isNumber()) == true
      }
      it("changes shared object") {
        try! runtime?.eval("object = new ExpoModules.TestModule.Counter(0)")
        let incrementBy = Int.random(in: 1..<100)
        let value = try runtime!.eval("object.getValue()").asInt()
        let newValue = try runtime!.eval([
          "object.increment(\(incrementBy))",
          "object.getValue()",
        ])

        expect(newValue.kind) == .number
        expect(newValue.getInt()) == value + incrementBy
      }
    }
  }
}

/**
 A module that exposes a Counter class with an associated shared object class.
 */
fileprivate final class ModuleWithCounterClass: Module {
  func definition() -> ModuleDefinition {
    Name("TestModule")

    Class(Counter.self) {
      Constructor { (initialValue: Int) in
        return Counter(initialValue: initialValue)
      }
      Function("increment") { (counter, value: Int) in
        counter.increment(by: value)
      }
      Function("getValue") { counter in
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

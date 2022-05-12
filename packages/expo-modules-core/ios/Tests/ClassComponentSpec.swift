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
        try runtime?.eval("myObject = new ExpoModules.ClassTest.MyClass()")
        let isInstanceOf = try runtime?.eval("myObject instanceof ExpoModules.ClassTest.MyClass")

        expect(isInstanceOf?.getBool()) == true
      }

      it("defines properties on initialization") {
        // The properties are not specified in the prototype, but defined during initialization.
        let object = try runtime?.eval("new ExpoModules.ClassTest.MyClass()").asObject()
        expect(object?.getPropertyNames()).to(contain("foo"))
        expect(object?.getProperty("foo").getString()) == "bar"
      }
    }
  }
}

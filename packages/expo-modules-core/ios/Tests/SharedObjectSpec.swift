import ExpoModulesTestCore

@testable import ExpoModulesCore

final class SharedObjectSpec: ExpoSpec {
  override class func spec() {
    let appContext = AppContext.create()
    let runtime = try! appContext.runtime

    beforeSuite {
      appContext.moduleRegistry.register(moduleType: SharedObjectModule.self)
    }

    describe("Base JS class") {
      it("exists") {
        let baseSharedObjectClass = try runtime.eval("expo.SharedObject")
        expect(baseSharedObjectClass.kind) == .function
      }

      it("has release function in prototype") {
        let releaseFunction = try runtime.eval("expo.SharedObject.prototype.release")
        expect(releaseFunction.kind) == .function
      }

      it("initializes") {
        let sharedObject = try runtime.eval("new expo.SharedObject()")
        expect(sharedObject.kind) == .object
      }

      it("does not register") {
        let registrySizeBefore = appContext.sharedObjectRegistry.size
        try runtime.eval("new expo.SharedObject()")
        expect(appContext.sharedObjectRegistry.size) == registrySizeBefore
      }

      it("inherits from EventEmitter") {
        let isEventEmitter = try runtime.eval("new expo.SharedObject() instanceof expo.EventEmitter")
        expect(isEventEmitter.kind) == .bool
        expect(try isEventEmitter.asBool()) == true
      }
    }

    describe("Concrete JS class") {
      it("exists") {
        let sharedObjectClass = try runtime.eval("expo.modules.SharedObjectModule.SharedObjectExample")
        expect(sharedObjectClass.kind) == .function
      }

      it("has base class prototype") {
        let hasBaseClassPrototype = try runtime.eval("expo.modules.SharedObjectModule.SharedObjectExample.prototype instanceof expo.SharedObject")
        expect(hasBaseClassPrototype.kind) == .bool
        expect(try hasBaseClassPrototype.asBool()) == true
      }

      it("creates new instance") {
        let sharedObject = try runtime.eval("new expo.modules.SharedObjectModule.SharedObjectExample()")
        expect(sharedObject.kind) == .object
      }

      it("registers") {
        let registrySizeBefore = appContext.sharedObjectRegistry.size
        try runtime.eval("new expo.modules.SharedObjectModule.SharedObjectExample()")
        expect(appContext.sharedObjectRegistry.size) == registrySizeBefore + 1
      }

      it("is instance of") {
        let isInstanceOf = try runtime.eval([
          "sharedObject = new expo.modules.SharedObjectModule.SharedObjectExample()",
          "sharedObject instanceof expo.modules.SharedObjectModule.SharedObjectExample"
        ])
        expect(isInstanceOf.kind) == .bool
        expect(try isInstanceOf.asBool()) == true
      }

      it("is instance of base class") {
        let isInstanceOfBaseClass = try runtime.eval([
          "sharedObject = new expo.modules.SharedObjectModule.SharedObjectExample()",
          "sharedObject instanceof expo.SharedObject"
        ])
        expect(isInstanceOfBaseClass.kind) == .bool
        expect(try isInstanceOfBaseClass.asBool()) == true
      }

      it("has function from base class") {
        let releaseFunction = try runtime.eval([
          "sharedObject = new expo.modules.SharedObjectModule.SharedObjectExample()",
          "sharedObject.release"
        ])
        expect(releaseFunction.kind) == .function
      }
    }

    describe("Native object") {
      it("sends events") {
        // Create the shared object
        let jsObject = try runtime
          .eval("sharedObject = new expo.modules.SharedObjectModule.SharedObjectExample()")
          .asObject()

        // Add a listener that adds three arguments
        try runtime.eval([
          "total = 0",
          "sharedObject.addListener('test event', (a, b, c) => { total = a + b + c })"
        ])

        // Get the native instance
        let nativeObject = appContext.sharedObjectRegistry.toNativeObject(jsObject)

        // Send an event from the native object to JS
        nativeObject?.sendEvent(name: "test event", args: 1, 2, 3)

        // Check the value that is set by the listener
        let total = try runtime.eval("total")

        expect(total.kind) == .number
        expect(try total.asInt()) == 6
      }
    }
  }
}

private class SharedObjectModule: Module {
  public func definition() -> ModuleDefinition {
    Class(SharedObjectExample.self) {
      Constructor {
        return SharedObjectExample()
      }
    }
  }
}

private final class SharedObjectExample: SharedObject {}

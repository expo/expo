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

      it("returns this") {
        let isReturningItself = try runtime.eval([
          "sharedObject = new expo.modules.SharedObjectModule.SharedObjectExample()",
          "sharedObject === sharedObject.returnThis()"
        ])
        expect(isReturningItself.kind) == .bool
        expect(try isReturningItself.asBool()) == true
      }
    }

    describe("Native object") {
      // Event emitting requires Xcode 15.0, but we're still using Xcode 14
      // to run these tests on GitHub Actions due to some performance issues.
      #if swift(>=5.9)
      it("emits events") {
        // Create the shared object
        let jsObject = try runtime
          .eval("sharedObject = new expo.modules.SharedObjectModule.SharedObjectExample()")
          .asObject()

        // Add a listener that adds three arguments
        try runtime.eval([
          "result = null",
          "sharedObject.addListener('test event', (number, string, record) => { result = { number, string, record } })"
        ])

        // Get the native instance
        let nativeObject = appContext.sharedObjectRegistry.toNativeObject(jsObject)

        struct EventRecord: Record {
          @Field var boolean: Bool = true
        }

        // Emit an event from the native object to JS
        nativeObject?.emit(event: "test event", arguments: 123, "test", EventRecord())

        // Check the value that is set by the listener
        let result = try runtime.eval("result").asObject()

        expect(try result.getProperty("number").asInt()) == 123
        expect(try result.getProperty("string").asString()) == "test"
        expect(try result.getProperty("record").asObject().getProperty("boolean").asBool()) == true
      }
      #endif // swift(>=5.9)
    }
  }
}

private class SharedObjectModule: Module {
  public func definition() -> ModuleDefinition {
    Class(SharedObjectExample.self) {
      Constructor {
        return SharedObjectExample()
      }
      Function("returnThis") { (this: SharedObjectExample) -> SharedObjectExample in
        return this
      }
    }
  }
}

private final class SharedObjectExample: SharedObject {}

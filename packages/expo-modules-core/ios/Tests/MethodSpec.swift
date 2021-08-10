import Quick
import Nimble

@testable import ExpoModulesCore

class MethodSpec: QuickSpec {
  override func spec() {
    let appContext = AppContext()
    let methodName = "test method name"

    func testMethodReturning<T: Equatable>(value returnValue: T) {
      waitUntil { done in
        let module = CustomModule(appContext: appContext) {
          $0.method(methodName) {
            return returnValue
          }
        }

        ModuleHolder(module: module).call(method: methodName, args: []) { value, error in
          expect(value).notTo(beNil())
          expect(value).to(beAKindOf(T.self))
          expect(value as? T).to(equal(returnValue))
          done()
        }
      }
    }

    it("is called") {
      waitUntil { done in
        let module = CustomModule(appContext: appContext) {
          $0.method(methodName) {
            done()
          }
        }
        ModuleHolder(module: module).call(method: methodName, args: [])
      }
    }

    it("returns bool values") {
      testMethodReturning(value: true)
      testMethodReturning(value: false)
      testMethodReturning(value: [true, false])
    }

    it("returns int values") {
      testMethodReturning(value: 1234)
      testMethodReturning(value: [2, 1, 3, 7])
    }

    it("returns double values") {
      testMethodReturning(value: 3.14)
      testMethodReturning(value: [0, 1.1, 2.2])
    }

    it("returns string values") {
      testMethodReturning(value: "a string")
      testMethodReturning(value: ["expo", "modules", "core"])
    }

    it("throws when called with more arguments than expected") {
      waitUntil { done in
        let module = CustomModule(appContext: appContext) {
          $0.method(methodName) { (a: Int) in
            return "something"
          }
        }

        // Method expects one argument, let's give it more.
        ModuleHolder(module: module).call(method: methodName, args: [1, 2]) { value, error in
          expect(error).notTo(beNil())
          expect(error).to(beAKindOf(InvalidArgsNumberError.self))
          expect(error?.code).to(equal("ERR_INVALID_ARGS_NUMBER"))
          expect(error?.description).to(equal(InvalidArgsNumberError(received: 2, expected: 1).description))
          done()
        }
      }
    }

    it("throws when called with arguments of incompatible types") {
      waitUntil { done in
        let module = CustomModule(appContext: appContext) {
          $0.method(methodName) { (a: String) in
            return "something"
          }
        }

        // Method expects a string, let's give it a number.
        ModuleHolder(module: module).call(method: methodName, args: [1]) { value, error in
          expect(error).notTo(beNil())
          expect(error).to(beAKindOf(IncompatibleArgTypeError<Any?, AnyArgumentType>.self))
          expect(error?.code).to(equal("ERR_INCOMPATIBLE_ARG_TYPE"))
          // TODO: (@tsapeta) The descriptions may not equal yet, due to internal type-erasing. Fix it and uncomment this test.
          // expect(error?.description).to(equal(IncompatibleArgTypeError(argument: 1, atIndex: 0, desiredType: String.self).description))
          done()
        }
      }
    }
  }
}

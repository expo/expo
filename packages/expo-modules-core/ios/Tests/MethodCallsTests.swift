import XCTest

@testable import ExpoModulesCore

let methodName = "test method name"

class MethodCallsTests: XCTestCase {
  var appContext: AppContext!

  override func setUp() {
    appContext = AppContext()
  }

  /**
   Tests if the method gets called.
   */
  func test_plainMethodCall() {
    let expect = expectation(description: "method gets called")
    let module = CustomModule(appContext: appContext) {
      $0.method(methodName) {
        expect.fulfill()
      }
    }
    ModuleHolder(module: module).call(method: methodName, args: [])
    waitForExpectations(timeout: 1)
  }

  /**
   Tests if the method properly passes bools and array of bools.
   */
  func test_methodReturningBools() {
    test_methodReturning(value: true)
    test_methodReturning(value: false)
    test_methodReturning(value: [true, false])
  }

  /**
   Tests if the method properly passes ints and array of ints.
   */
  func test_methodReturningInts() {
    test_methodReturning(value: 1234)
    test_methodReturning(value: [2, 1, 3, 7])
  }

  /**
   Tests if the method properly passes doubles and array of doubles.
   */
  func test_methodReturningDoubles() {
    test_methodReturning(value: 3.14)
    test_methodReturning(value: [0, 1.1, 2.2])
  }

  /**
   Tests if the method properly passes strings and array of strings.
   */
  func test_methodReturningStrings() {
    test_methodReturning(value: "a string")
    test_methodReturning(value: ["expo", "modules", "core"])
  }

  func test_tooManyArguments() {
    let expect = expectation(description: "method gets called")
    let module = CustomModule(appContext: appContext) {
      $0.method(methodName) { (a: Int) in
        return "something"
      }
    }

    // Method expects one argument, let's give it more.
    ModuleHolder(module: module).call(method: methodName, args: [1, 2]) { value, error in
      XCTAssertNotNil(error)
      XCTAssertEqual(error!.code, "ERR_INVALID_ARGS_NUMBER", "error has code: \(error!.code)")
      XCTAssertEqual(error!.description, InvalidArgsNumberError(received: 2, expected: 1).description)
      expect.fulfill()
    }
    waitForExpectations(timeout: 1)
  }

  /**
   Tests if the method throws correct error when it receives an argument with incompatible type.
   */
  func test_methodIncompatibleArgsCall() {
    let expect = expectation(description: "method gets called")
    let module = CustomModule(appContext: appContext) {
      $0.method(methodName) { (a: String) in
        return "something"
      }
    }

    // Method expects a string, let's give it a number.
    ModuleHolder(module: module).call(method: methodName, args: [1]) { value, error in
      XCTAssertNotNil(error)
      XCTAssertEqual(error!.code, "ERR_INCOMPATIBLE_ARG_TYPE", "error has code: \(error!.code)")
      // TODO: (@tsapeta) The descriptions may not equal yet, due to internal type-erasing. Fix it and uncomment this test.
      // XCTAssertEqual(error!.description, IncompatibleArgTypeError(argument: 1, atIndex: 0, desiredType: String.self).description)
      expect.fulfill()
    }
    waitForExpectations(timeout: 1)
  }

  // MARK: privates

  private func test_methodReturning<T: Equatable>(value returnValue: T) {
    let expect = expectation(description: "method gets called")
    let module = CustomModule(appContext: appContext) {
      $0.method(methodName) {
        return returnValue
      }
    }

    ModuleHolder(module: module).call(method: methodName, args: []) { value, error in
      XCTAssertNotNil(value)
      XCTAssertTrue(value is T, "\(value!) is of type \(T.self)")
      XCTAssertEqual(value as! T, returnValue, "\(value!) equals to \(returnValue)")
      expect.fulfill()
    }
    waitForExpectations(timeout: 1)
  }
}

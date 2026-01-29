// Copyright 2021-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("Exceptions")
struct ExceptionsTests {
  // MARK: - Native

  @Test
  func `has name`() {
    let error = TestException()
    #expect(error.name == "TestException")
  }

  @Test
  func `has code`() {
    let error = TestException()
    #expect(error.code == "ERR_TEST")
  }

  @Test
  func `has reason`() {
    let error = TestException()
    #expect(error.reason == "This is the test exception")
  }

  @Test
  func `can be chained once`() {
    func throwable() throws {
      do {
        throw TestExceptionCause()
      } catch {
        throw TestException().causedBy(error)
      }
    }
    #expect {
      try throwable()
    } throws: { error in
      testChainedExceptionTypes(error: error, types: [TestException.self, TestExceptionCause.self])
    }
  }

  @Test
  func `can be chained twice`() {
    func throwable() throws {
      do {
        do {
          throw TestExceptionCause()
        } catch {
          throw TestExceptionCause().causedBy(error)
        }
      } catch {
        throw TestException().causedBy(error)
      }
    }
    #expect {
      try throwable()
    } throws: { error in
      testChainedExceptionTypes(error: error, types: [TestException.self, TestExceptionCause.self, TestExceptionCause.self])
    }
  }

  @Test
  func `includes cause description`() {
    func throwable() throws {
      do {
        throw TestExceptionCause()
      } catch {
        throw TestException().causedBy(error)
      }
    }
    #expect {
      try throwable()
    } throws: { error in
      guard let error = error as? TestException, let cause = error.cause as? TestExceptionCause else {
        return false
      }
      return error.description.contains(cause.description)
    }
  }

  @Test
  func `has root cause`() {
    let a = TestException()
    let b = TestException().causedBy(a)
    let c = TestException().causedBy(b)

    #expect(c.rootCause as? TestException === a)
  }

  // MARK: - JavaScript

  @Test
  func `sync function throw`() throws {
    let appContext = AppContext.create()
    let runtime = try appContext.runtime

    appContext.moduleRegistry.register(holder: mockModuleHolder(appContext) {
      Name("TestModule")

      Function("codedException") {
        throw TestCodedException()
      }

      AsyncFunction("codedExceptionThrowAsync") { () in
        throw TestCodedException()
      }

      AsyncFunction("codedExceptionRejectAsync") { (promise: Promise) in
        promise.reject(TestCodedException())
      }

      AsyncFunction("codedExceptionConcurrentAsync") { () async throws in
        throw TestCodedException()
      }
    })

    let error = try runtime.eval("try { expo.modules.TestModule.codedException() } catch (error) { error }").asObject()
    #expect(error.getProperty("message").getString().contains("FunctionCallException: Calling the 'codedException' function has failed"))
    #expect(error.getProperty("code").getString() == "E_TEST_CODE")
  }
}

// MARK: - Test Helpers

final class TestException: Exception {
  override var reason: String {
    "This is the test exception"
  }
}

final class TestExceptionCause: Exception {
  override var reason: String {
    "This is the cause of the test exception"
  }
}

final class TestCodedException: Exception {
  init() {
    super.init(name: "TestException",
               description: "This is a test Exception with a code",
               code: "E_TEST_CODE")
  }
}

/**
 Tests whether the exception chain matches given types and their order.
 */
private func testChainedExceptionTypes(error: Error, types: [Error.Type]) -> Bool {
  var next: Error? = error

  for errorType in types {
    let expectedErrorTypeName = String(describing: errorType)
    let currentErrorTypeName = String(describing: type(of: next!))

    if currentErrorTypeName != expectedErrorTypeName {
      return false
    }

    if let chainableException = next as? ChainableException {
      next = chainableException.cause
    } else {
      next = nil
    }
  }
  return true
}

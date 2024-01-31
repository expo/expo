// Copyright 2021-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesCore

final class ExceptionsSpec: ExpoSpec {
  override class func spec() {
    it("has name") {
      let error = TestException()
      expect(error.name) == "TestException"
    }

    it("has code") {
      let error = TestException()
      expect(error.code) == "ERR_TEST"
    }

    it("has reason") {
      let error = TestException()
      expect(error.reason) == "This is the test exception"
    }

    it("can be chained once") {
      func throwable() throws {
        do {
          throw TestExceptionCause()
        } catch {
          throw TestException().causedBy(error)
        }
      }
      expect { try throwable() }.to(throwError { error in
        testChainedExceptionTypes(error: error, types: [TestException.self, TestExceptionCause.self])
      })
    }

    it("can be chained twice") {
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
      expect { try throwable() }.to(throwError { error in
        testChainedExceptionTypes(error: error, types: [TestException.self, TestExceptionCause.self, TestExceptionCause.self])
      })
    }

    it("includes cause description") {
      func throwable() throws {
        do {
          throw TestExceptionCause()
        } catch {
          throw TestException().causedBy(error)
        }
      }
      expect { try throwable() }.to(throwError { error in
        if let error = error as? TestException, let cause = error.cause as? TestExceptionCause {
          expect(error.description).to(contain(cause.description))
        } else {
          fail("Error and its cause are not of expected types.")
        }
      })
    }

    it("has root cause") {
      let a = TestException()
      let b = TestException().causedBy(a)
      let c = TestException().causedBy(b)

      expect(c.rootCause as! TestException) === a
    }
  }
}

class TestException: Exception {
  override var reason: String {
    "This is the test exception"
  }
}

class TestExceptionCause: Exception {
  override var reason: String {
    "This is the cause of the test exception"
  }
}

/**
 Tests whether the exception chain matches given types and their order.
 */
private func testChainedExceptionTypes(error: Error, types: [Error.Type]) {
  var next: Error? = error

  for errorType in types {
    let expectedErrorTypeName = String(describing: errorType)
    let currentErrorTypeName = String(describing: type(of: next!))

    expect(currentErrorTypeName).to(equal(expectedErrorTypeName), description: "The cause is not of type \(expectedErrorTypeName)")

    if let chainableException = next as? ChainableException {
      next = chainableException.cause
    } else {
      next = nil
    }
  }
}

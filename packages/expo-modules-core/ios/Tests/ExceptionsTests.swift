// Copyright 2021-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

@Suite("Exceptions")
@JavaScriptActor
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
  func `has reason from the description it was created with`() {
    let error = TestCodedException()
    #expect(error.reason == "This is a test Exception with a code")
  }

  @Test
  func `includes the description it was created with in the debug description`() {
    let error = TestCodedException()
    #expect(error.debugDescription.contains("TestException: This is a test Exception with a code"))
  }

  @Test
  func `includes cause description when created with a description`() {
    let error = TestCodedException().causedBy(TestExceptionCause())
    #expect(error.description.contains("This is a test Exception with a code"))
    #expect(error.description.contains("This is the cause of the test exception"))
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
    Self.registerTestModule(on: appContext)

    let error = try runtime.eval("try { expo.modules.TestModule.codedException() } catch (error) { error }").asObject()
    let message = error.getProperty("message").getString()
    #expect(message.hasPrefix("Calling the 'codedException' function has failed"))
    #expect(message.contains("This is a test Exception with a code"))
    #expect(error.getProperty("code").getString() == "E_TEST_CODE")
  }

  @Test
  func `sync function throw does not leak the debug description to JS`() throws {
    let appContext = AppContext.create()
    let runtime = try appContext.runtime
    Self.registerTestModule(on: appContext)

    let message = try runtime.eval("try { expo.modules.TestModule.codedException() } catch (error) { error.message }").getString()
    #expect(!message.contains("FunctionCallException:"))
    #expect(!message.contains("(at "))
  }

  @Test
  func `async function throw exposes the code to JS`() async throws {
    let appContext = AppContext.create()
    let runtime = try appContext.runtime
    Self.registerTestModule(on: appContext)

    let code = try await runtime.evalAsync(
      "expo.modules.TestModule.codedExceptionThrowAsync().then(() => 'NO_ERROR', (error) => error.code ?? 'NO_CODE')"
    )
    #expect(code.getString() == "E_TEST_CODE")
  }

  @Test
  func `async function reject exposes the code to JS`() async throws {
    let appContext = AppContext.create()
    let runtime = try appContext.runtime
    Self.registerTestModule(on: appContext)

    // A manual `promise.reject(error)` passes the error straight through (unlike a thrown error,
    // which gets wrapped in a `FunctionCallException`), so we only assert on the preserved `code`.
    let code = try await runtime.evalAsync(
      "expo.modules.TestModule.codedExceptionRejectAsync().then(() => 'NO_ERROR', (error) => error.code ?? 'NO_CODE')"
    )
    #expect(code.getString() == "E_TEST_CODE")
  }

  @Test
  func `async function reject exposes the description as the message to JS`() async throws {
    let appContext = TestAppContext()
    let runtime = try appContext.runtime
    Self.registerTestModule(on: appContext)

    // The JS message must be exactly the exception's `description`, not its `debugDescription`
    // (type name + native file:line), so JS code can rely on it as written by the module.
    let message = try await runtime.evalAsync(
      "expo.modules.TestModule.codedExceptionRejectAsync().then(() => 'NO_ERROR', (error) => error.message ?? 'NO_MESSAGE')"
    )
    #expect(message.getString() == "This is a test Exception with a code")
  }

  @Test
  func `exception subclass can override the message exposed to JS`() async throws {
    let appContext = TestAppContext()
    let runtime = try appContext.runtime
    Self.registerTestModule(on: appContext)

    let message = try await runtime.evalAsync(
      "expo.modules.TestModule.customMessageRejectAsync().then(() => 'NO_ERROR', (error) => error.message ?? 'NO_MESSAGE')"
    )
    #expect(message.getString() == "Custom JS message")
  }

  @Test
  func `concurrent async function throw exposes the code to JS`() async throws {
    let appContext = TestAppContext()
    let runtime = try appContext.runtime
    Self.registerTestModule(on: appContext)

    let code = try await runtime.evalAsync(
      "expo.modules.TestModule.codedExceptionConcurrentAsync().then(() => 'NO_ERROR', (error) => error.code ?? 'NO_CODE')"
    )
    #expect(code.getString() == "E_TEST_CODE")
  }

  @Test
  func `async function reject with a code and a description exposes the description to JS`() async throws {
    let appContext = AppContext.create()
    let runtime = try appContext.runtime
    Self.registerTestModule(on: appContext)

    let message = try await runtime.evalAsync(
      "expo.modules.TestModule.codedRejectWithDescriptionAsync().then(() => 'NO_ERROR', (error) => error.message ?? 'NO_MESSAGE')"
    )
    #expect(message.getString().contains("This is the rejection description"))
  }

  private static func registerTestModule(on appContext: AppContext) {
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

      AsyncFunction("codedRejectWithDescriptionAsync") { (promise: Promise) in
        promise.reject("E_TEST_CODE", "This is the rejection description")
      }

      AsyncFunction("customMessageRejectAsync") { (promise: Promise) in
        promise.reject(TestCustomMessageException())
      }

      AsyncFunction("codedExceptionConcurrentAsync") { () async throws in
        throw TestCodedException()
      }
    })
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

final class TestCustomMessageException: Exception {
  override var reason: String {
    "This reason is not shown to JS"
  }

  override var message: String {
    "Custom JS message"
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

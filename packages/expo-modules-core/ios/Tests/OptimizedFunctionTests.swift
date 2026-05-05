// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation
import Testing

@testable import ExpoModulesCore

@Suite("OptimizedFunction", .serialized)
@JavaScriptActor
struct OptimizedFunctionTests {
  let appContext: AppContext

  init() {
    self.appContext = AppContext.create()

    appContext.moduleRegistry.register(holder: mockModuleHolder(appContext) {
      Name("TestModule")

      Function(
        "addNumbers",
        OptimizedSyncFunctionDefinition.createDescriptor(
          typeEncoding: "d@?dd",
          argsCount: 2,
          block: ({ (a: Double, b: Double) -> Double in
            return a + b
          } as @convention(block) (Double, Double) -> Double) as AnyObject
        )
      )

      Function(
        "addInts",
        OptimizedSyncFunctionDefinition.createDescriptor(
          typeEncoding: "q@?qq",
          argsCount: 2,
          block: ({ (a: Int64, b: Int64) -> Int64 in
            return a + b
          } as @convention(block) (Int64, Int64) -> Int64) as AnyObject
        )
      )

      Function(
        "concat",
        OptimizedSyncFunctionDefinition.createDescriptor(
          typeEncoding: "@@?@@",
          argsCount: 2,
          block: ({ (a: String, b: String) -> String in
            return a + b
          } as @convention(block) (String, String) -> String) as AnyObject
        )
      )

      Function(
        "negate",
        OptimizedSyncFunctionDefinition.createDescriptor(
          typeEncoding: "B@?B",
          argsCount: 1,
          block: ({ (value: Bool) -> Bool in
            return !value
          } as @convention(block) (Bool) -> Bool) as AnyObject
        )
      )

      Function(
        "noop",
        OptimizedSyncFunctionDefinition.createDescriptor(
          typeEncoding: "v@?",
          argsCount: 0,
          block: ({ () -> Void in
            return
          } as @convention(block) () -> Void) as AnyObject
        )
      )

      AsyncFunction(
        "addNumbersAsync",
        OptimizedSyncFunctionDefinition.createDescriptor(
          typeEncoding: "d@?dd",
          argsCount: 2,
          block: ({ (a: Double, b: Double) -> Double in
            return a + b
          } as @convention(block) (Double, Double) -> Double) as AnyObject
        )
      )

      AsyncFunction(
        "concatAsync",
        OptimizedSyncFunctionDefinition.createDescriptor(
          typeEncoding: "@@?@@",
          argsCount: 2,
          block: ({ (a: String, b: String) -> String in
            return a + b
          } as @convention(block) (String, String) -> String) as AnyObject
        )
      )

      // Mirrors the throwing wrapper that the @OptimizedFunction macro generates:
      // a Swift error becomes an NSException whose userInfo carries `code` and `message`.
      Function(
        "throwing",
        OptimizedSyncFunctionDefinition.createDescriptor(
          typeEncoding: "d@?d",
          argsCount: 1,
          block: ({ (value: Double) -> Double in
            let exception = NSException(
              name: NSExceptionName("OptimizedTestError"),
              reason: "intentional failure",
              userInfo: [
                "name": "OptimizedTestError",
                "code": "ERR_OPTIMIZED_TEST",
                "message": "intentional failure"
              ]
            )
            exception.raise()
            return value
          } as @convention(block) (Double) -> Double) as AnyObject
        )
      )

      AsyncFunction(
        "piAsync",
        OptimizedSyncFunctionDefinition.createDescriptor(
          typeEncoding: "d@?",
          argsCount: 0,
          block: ({ () -> Double in
            return 3.14
          } as @convention(block) () -> Double) as AnyObject
        )
      )

      AsyncFunction(
        "throwingAsync",
        OptimizedSyncFunctionDefinition.createDescriptor(
          typeEncoding: "d@?d",
          argsCount: 1,
          block: ({ (value: Double) -> Double in
            let exception = NSException(
              name: NSExceptionName("OptimizedAsyncTestError"),
              reason: "intentional async failure",
              userInfo: [
                "name": "OptimizedAsyncTestError",
                "code": "ERR_OPTIMIZED_ASYNC_TEST",
                "message": "intentional async failure"
              ]
            )
            exception.raise()
            return value
          } as @convention(block) (Double) -> Double) as AnyObject
        )
      )
    })
  }

  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  // MARK: - Sync

  @Test
  func `adds two doubles`() async throws {
    let result = try await runtime.evalAsync("expo.modules.TestModule.addNumbers(2.5, 3.25)")
    #expect(result.isNumber() == true)
    #expect(result.getDouble() == 5.75)
  }

  @Test
  func `adds two integers`() async throws {
    let result = try await runtime.evalAsync("expo.modules.TestModule.addInts(40, 2)")
    #expect(result.isNumber() == true)
    #expect(result.getDouble() == 42.0)
  }

  @Test
  func `concatenates two strings`() async throws {
    let result = try await runtime.evalAsync("expo.modules.TestModule.concat('Hello, ', 'world!')")
    #expect(result.isString() == true)
    #expect(result.getString() == "Hello, world!")
  }

  @Test
  func `negates a boolean`() async throws {
    let trueResult = try await runtime.evalAsync("expo.modules.TestModule.negate(false)")
    #expect(trueResult.isBool() == true)
    #expect(trueResult.getBool() == true)

    let falseResult = try await runtime.evalAsync("expo.modules.TestModule.negate(true)")
    #expect(falseResult.isBool() == true)
    #expect(falseResult.getBool() == false)
  }

  @Test
  func `returns undefined for void return type`() async throws {
    let result = try await runtime.evalAsync("expo.modules.TestModule.noop()")
    #expect(result.isUndefined() == true)
  }

  // MARK: - Async

  @Test
  func `resolves with a number`() async throws {
    let result = try await runtime.evalAsync("expo.modules.TestModule.addNumbersAsync(10, 32)")
    #expect(result.isNumber() == true)
    #expect(result.getDouble() == 42.0)
  }

  @Test
  func `resolves with a string`() async throws {
    let result = try await runtime.evalAsync("expo.modules.TestModule.concatAsync('async ', 'works')")
    #expect(result.isString() == true)
    #expect(result.getString() == "async works")
  }

  // MARK: - Exceptions

  @Test
  func `surfaces an NSException as a JS Error with a code`() async throws {
    let result = try await runtime.evalAsync("""
      (() => {
        try {
          expo.modules.TestModule.throwing(1);
          return null;
        } catch (error) {
          return { message: error.message, code: error.code };
        }
      })()
      """)
    let error = try result.asObject()
    #expect(try error.getProperty("message").asString() == "intentional failure")
    #expect(try error.getProperty("code").asString() == "ERR_OPTIMIZED_TEST")
  }

  @Test
  func `resolves a no-arg async call`() async throws {
    let result = try await runtime.evalAsync("expo.modules.TestModule.piAsync()")
    #expect(result.isNumber() == true)
    #expect(result.getDouble() == 3.14)
  }

  @Test
  func `rejects with a JS Error when an NSException is raised`() async throws {
    let result = try await runtime.evalAsync("""
      expo.modules.TestModule.throwingAsync(1).then(
        () => null,
        (error) => ({ message: error.message, code: error.code })
      )
      """)
    let error = try result.asObject()
    #expect(try error.getProperty("message").asString() == "intentional async failure")
    #expect(try error.getProperty("code").asString() == "ERR_OPTIMIZED_ASYNC_TEST")
  }

  @Test
  func `throws when fewer arguments than declared are passed`() async throws {
    let error = try await #require(throws: ScriptEvaluationError.self) {
      return try await runtime.evalAsync("expo.modules.TestModule.addNumbers(1)")
    }
    #expect(error.message == "Received 1 arguments, but 2 was expected")
  }

  @Test
  func `throws when more arguments than declared are passed`() async throws {
    let error = try await #require(throws: ScriptEvaluationError.self) {
      return try await runtime.evalAsync("expo.modules.TestModule.addNumbers(1, 2, 3)")
    }
    #expect(error.message == "Received 3 arguments, but 2 was expected")
  }

  @Test
  func `async call throws when fewer arguments than declared are passed`() async throws {
    // Argument count is validated synchronously, so the host function throws
    // before a promise is ever returned.
    let error = try await #require(throws: ScriptEvaluationError.self) {
      return try await runtime.evalAsync("expo.modules.TestModule.addNumbersAsync(1)")
    }
    #expect(error.message == "Received 1 arguments, but 2 was expected")
  }

  @Test
  func `propagates the host-function error to Swift when uncaught in JS`() async throws {
    // When the JS source doesn't catch the error, JSI surfaces it as a C++
    // exception and `evalAsync` rethrows it as a Swift error.
    await #expect(throws: (any Error).self) {
      try await runtime.evalAsync("expo.modules.TestModule.addNumbers(1)")
    }
  }

  @Test
  func `keeps overlapping async calls isolated`() async throws {
    // Fires both promises and awaits the joined result, so the two NSInvocations
    // run concurrently from the helper's perspective. Verifies they do not share
    // state (e.g. arguments leaking between calls).
    let result = try await runtime.evalAsync("""
      Promise.all([
        expo.modules.TestModule.addNumbersAsync(1, 2),
        expo.modules.TestModule.addNumbersAsync(10, 20)
      ])
      """)
    let array = try result.asArray()
    #expect(array.length == 2)
    #expect(try array.getValue(at: 0).asDouble() == 3.0)
    #expect(try array.getValue(at: 1).asDouble() == 30.0)
  }
}

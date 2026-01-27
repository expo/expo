import Testing
import Foundation

@testable import ExpoModulesCore

@Suite
struct AsyncFunctionTests {
  static func getNativeModule(_ appContext: AppContext) -> ModuleHolder {
    return mockModuleHolder(appContext) {
      Name("TestModule")

      AsyncFunction("optionalAndPromise") { (optionalArg: String?, promise: Promise) in
        promise.resolve(optionalArg ?? "nil")
      }

      AsyncFunction("mandatoryOptionalPromise") { (mandatoryArg: String, optionalArg: String?, promise: Promise) in
        promise.resolve("\(mandatoryArg) + \(optionalArg ?? "nil")")
      }
    }
  }

  @Suite("Native")
  struct Native {
    let appContext: AppContext
    let nativeModule: ModuleHolder

    init() {
      self.appContext = AppContext.create()
      self.nativeModule = AsyncFunctionTests.getNativeModule(appContext)
    }

    private func callAsync<T: Sendable & Comparable>(
      function functionName: String,
      args: [Any] = []
    ) async throws -> T {
      return try await withCheckedThrowingContinuation { continuation in
        nativeModule.call(function: functionName, args: args) { result in
          continuation.resume(with: Result {
            switch result {
            case .success(let anyValue):
              return try #require(anyValue as? T, "Failed casting a value")
            case .failure(let exception):
              throw exception
            }
          })
        }
      }
    }

    @Test("works with optional argument provided")
    func testOptionalArgPresent() async throws {
      let result: String = try await callAsync(function: "optionalAndPromise", args: ["arg1"])
      #expect(result == "arg1")
    }

    @Test("works skipping trailing optional argument")
    func testOptionalArgMissing() async throws {
      let result: String = try await callAsync(function: "optionalAndPromise", args: [])
      #expect(result == "nil")
    }

    @Test("works with mandatory arg but skipping optional")
    func testMandatoryArg() async throws {
      let result: String = try await callAsync(function: "mandatoryOptionalPromise", args: ["mandatory"])
      #expect(result == "mandatory + nil")
    }
  }

  @Suite("JavaScript")
  struct JavaScript {
    let appContext: AppContext
    let nativeModule: ModuleHolder

    init() {
      self.appContext = AppContext.create()
      self.nativeModule = AsyncFunctionTests.getNativeModule(appContext)
      appContext.moduleRegistry.register(holder: self.nativeModule)
    }

    @Test("works in JS with optional argument provided")
    func testOptionalArgPresentJS() async throws {
      let runtime = try #require(try? appContext.runtime)

      let jsCode = """
        expo.modules.TestModule.optionalAndPromise('Hello JS')
          .then((result) => { globalThis.result = result; });
      """
      try runtime.eval(jsCode)

      try await expect(in: runtime, equals: "Hello JS")
    }

    @Test("works in JS skipping trailing optional argument")
    func testOptionalArgMissingJS() async throws {
      let runtime = try #require(try? appContext.runtime)

      let jsCode = """
        expo.modules.TestModule.optionalAndPromise()
          .then((result) => { globalThis.result = result; });
      """
      try runtime.eval(jsCode)

      try await expect(in: runtime, equals: "nil")
    }
    
    @Test("works in JS with mandatory arg but skipping optional")
    func testMandatoryArgJS() async throws {
      let runtime = try #require(try? appContext.runtime)

      let jsCode = """
        expo.modules.TestModule.mandatoryOptionalPromise('mandatory')
          .then((result) => { globalThis.result = result; });
      """
      try runtime.eval(jsCode)

      try await expect(in: runtime, equals: "mandatory + nil")
    }

    private func expect(in runtime: JavaScriptRuntime, equals expected: String) async throws {
      try await expectEventually {
        guard let resultValue = try? runtime.eval("globalThis.result") else {
          return false
        }
        if resultValue.isString() {
          return try resultValue.asString() == expected
        }
        return false
      }
    }
  }
}

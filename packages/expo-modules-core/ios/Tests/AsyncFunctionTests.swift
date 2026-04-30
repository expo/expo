import Testing
import Foundation

@testable import ExpoModulesCore

@Suite
@JavaScriptActor
struct AsyncFunctionTests {
  let appContext: AppContext

  init() {
    self.appContext = AppContext.create()
    appContext.moduleRegistry.register(holder: mockModuleHolder(appContext) {
      Name("TestModule")

      AsyncFunction("optionalAndPromise") { (optionalArg: String?, promise: Promise) in
        promise.resolve(optionalArg ?? "nil")
      }

      AsyncFunction("mandatoryOptionalPromise") { (mandatoryArg: String, optionalArg: String?, promise: Promise) in
        promise.resolve("\(mandatoryArg) + \(optionalArg ?? "nil")")
      }

      AsyncFunction("resolvesRecord") { (promise: Promise) in
        let record = TestRecord()
        record.message = "resolved"
        promise.resolve(record)
      }

      AsyncFunction("resolvesRecordWithUndefined") {
        return WithUndefinedRecord()
      }

      AsyncFunction("returnsOptionalString") { (returnNil: Bool) -> String? in
        return returnNil ? nil : "present"
      }
    })
  }

  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  @Test("works with optional argument provided")
  func testOptionalArgPresent() async throws {
    try runtime.eval("expo.modules.TestModule.optionalAndPromise('Hello JS').then((result) => { globalThis.result = result; })")
    try await expect(equals: "Hello JS")
  }

  @Test("works skipping trailing optional argument")
  func testOptionalArgMissing() async throws {
    try runtime.eval("expo.modules.TestModule.optionalAndPromise().then((result) => { globalThis.result = result; })")
    try await expect(equals: "nil")
  }

  @Test("works with mandatory arg but skipping optional")
  func testMandatoryArg() async throws {
    try runtime.eval("expo.modules.TestModule.mandatoryOptionalPromise('mandatory').then((result) => { globalThis.result = result; })")
    try await expect(equals: "mandatory + nil")
  }

  @Test("converts a Record resolved via the manual promise path")
  func testResolvesRecord() async throws {
    try runtime.eval("expo.modules.TestModule.resolvesRecord().then((result) => { globalThis.result = result.message; })")
    try await expect(equals: "resolved")
  }

  @Test
  func `converts a Record with undefined fields returned from async function`() async throws {
    let result = try await runtime.evalAsync("expo.modules.TestModule.resolvesRecordWithUndefined()")
    let object = try result.asObject()

    #expect(object.hasProperty("a") == true)
    #expect(try object.getProperty("a").asDouble() == 1.0)
    #expect(object.hasProperty("b") == true)
    #expect(object.getProperty("b").isUndefined() == true)
  }

  @Test
  func `returns null when the optional return value is nil`() async throws {
    let result = try await runtime.evalAsync("expo.modules.TestModule.returnsOptionalString(true)")
    #expect(result.isNull() == true)
  }

  @Test
  func `passes through the value when the optional return value is non-nil`() async throws {
    let result = try await runtime.evalAsync("expo.modules.TestModule.returnsOptionalString(false)")
    #expect(result.isString() == true)
    #expect(result.getString() == "present")
  }

  nonisolated private func expect(equals expected: String) async throws {
    try await expectEventually {
      guard let resultValue = try? await self.runtime.eval("globalThis.result") else {
        return false
      }
      if resultValue.isString() {
        return try await resultValue.asString() == expected
      }
      return false
    }
  }
}

fileprivate struct TestRecord: Record {
  init() {}

  @Field
  var message: String = ""
}

fileprivate struct WithUndefinedRecord: Record {
  @Field var a: ValueOrUndefined<Double> = .value(unwrapped: 1.0)
  @Field var b: ValueOrUndefined<Double> = .undefined
}

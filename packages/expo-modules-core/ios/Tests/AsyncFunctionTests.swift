import ExpoModulesTestCore
import Testing
import Foundation

@testable import ExpoModulesCore

@Suite
@JavaScriptActor
struct AsyncFunctionTests {
  let appContext: AppContext

  init() {
    self.appContext = TestAppContext()
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

      AsyncFunction("returnsOptionalRecordWithNilField") { () -> SynthesizedMixedRecord? in
        return SynthesizedMixedRecord(name: "present", count: 7, note: nil)
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
    let result = try await runtime.evalAsync("expo.modules.TestModule.optionalAndPromise('Hello JS')").ref()
    // `evalAsync` resumes off the JavaScript thread, so the result is read on it.
    #expect(try await runtime.execute { try result.take().asString() } == "Hello JS")
  }

  @Test("works skipping trailing optional argument")
  func testOptionalArgMissing() async throws {
    let result = try await runtime.evalAsync("expo.modules.TestModule.optionalAndPromise()").ref()
    #expect(try await runtime.execute { try result.take().asString() } == "nil")
  }

  @Test("works with mandatory arg but skipping optional")
  func testMandatoryArg() async throws {
    let result = try await runtime.evalAsync("expo.modules.TestModule.mandatoryOptionalPromise('mandatory')").ref()
    #expect(try await runtime.execute { try result.take().asString() } == "mandatory + nil")
  }

  @Test("converts a Record resolved via the manual promise path")
  func testResolvesRecord() async throws {
    let result = try await runtime.evalAsync("expo.modules.TestModule.resolvesRecord().then((result) => result.message)").ref()
    #expect(try await runtime.execute { try result.take().asString() } == "resolved")
  }

  @Test
  func `converts a Record with undefined fields returned from async function`() async throws {
    let result = try await runtime.evalAsync("expo.modules.TestModule.resolvesRecordWithUndefined()").ref()
    let (hasA, a, hasB, isBUndefined) = try await runtime.execute {
      let object = try result.take().asObject()
      return (
        object.hasProperty("a"),
        try object.getProperty("a").asDouble(),
        object.hasProperty("b"),
        object.getProperty("b").isUndefined()
      )
    }

    #expect(hasA == true)
    #expect(a == 1.0)
    #expect(hasB == true)
    #expect(isBUndefined == true)
  }

  @Test
  func `returns null when the optional return value is nil`() async throws {
    let result = try await runtime.evalAsync("expo.modules.TestModule.returnsOptionalString(true)")
    #expect(result.isNull() == true)
  }

  @Test
  func `passes through the value when the optional return value is non-nil`() async throws {
    let result = try await runtime.evalAsync("expo.modules.TestModule.returnsOptionalString(false)").ref()
    #expect(try await runtime.execute { try result.take().asString() } == "present")
  }

  @Test
  func `keeps a nil field as null when returning an optional record`() async throws {
    let result = try await runtime.evalAsync("expo.modules.TestModule.returnsOptionalRecordWithNilField()").ref()
    let (name, hasNote, isNoteNull) = try await runtime.execute {
      let object = try result.take().asObject()
      return (
        try object.getProperty("name").asString(),
        object.hasProperty("note"),
        object.getProperty("note").isNull()
      )
    }

    #expect(name == "present")
    #expect(hasNote == true)
    #expect(isNoteNull == true)
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

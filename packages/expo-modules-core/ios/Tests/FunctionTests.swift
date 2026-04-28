// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("Function")
struct FunctionTests {

  @Suite("JavaScript")
  @JavaScriptActor
  struct JavaScriptTests {
    let appContext: AppContext
    var runtime: ExpoRuntime {
      get throws {
        try appContext.runtime
      }
    }

    struct TestRecord: Record {
      @Field var property: String = "expo"
    }

    struct TestURLRecord: Record {
      static let defaultURLString = "https://expo.dev"
      static let defaultURL = URL(string: defaultURLString)!

      @Field var url: URL = defaultURL
    }

    struct WithUndefinedRecord: Record {
      @Field var a: ValueOrUndefined<Double> = .value(unwrapped: 1.0)
      @Field var b: ValueOrUndefined<Double> = .undefined
    }

    struct NullableValueOfUndefinedRecord: Record {
      @Field var a: ValueOrUndefined<Double?> = .value(unwrapped: 1.0)
    }

    struct TestRecordWithHeaders: Record {
      @Field var headers: [String: String] = [:]
    }

    struct TestEncodable: Encodable {
      let name: String
      let version: Int
    }

    init() {
      appContext = AppContext.create()

      appContext.moduleRegistry.register(holder: mockModuleHolder(appContext) {
        Name("TestModule")

        Function("returnPi") { Double.pi }

        Function("returnNull") { () -> Double? in
          return nil
        }

        Function("returnUndefined") { () -> JavaScriptValue in
          return .undefined
        }

        Function("isArgNull") { (arg: Double?) -> Bool in
          return arg == nil
        }

        Function("returnObjectDefinition") { (initial: Int) -> ObjectDefinition in
          var foo = initial

          return Object {
            Function("increment") { () -> Int in
              foo += 1
              return foo
            }
          }
        }

        Function("withFunction") { (fn: JavaScriptValue) throws -> String in
          return try fn.asFunction().call(arguments: "foo", "bar").asString()
        }

        Function("withCGFloat") { (f: CGFloat) in
          return "\(f)"
        }

        Function("withRecord") { (f: TestRecord) in
          return "\(f.property)"
        }

        Function("withRecordWithHeaders") { (f: TestRecordWithHeaders) in
          return "\(f.headers.count)"
        }

        Function("withURL") {
          return TestURLRecord.defaultURL
        }

        Function("withUndefined") {
          return WithUndefinedRecord()
        }

        Function("withNestedURL") {
          return TestURLRecord()
        }

        Function("withOptionalRecord") { (f: TestRecord?) in
          return "\(f?.property ?? "no value")"
        }

        Function("withNullableValueOrUndefinded") { (record: NullableValueOfUndefinedRecord) in
          // Expectations captured via side effects are not ideal, but works for migration
        }

        Function("withNullableValueOrUndefindedInArray") { (items: [ValueOrUndefined<Double?>]) in
          // Expectations captured via side effects are not ideal, but works for migration
        }

        Function("returnArrayOfUndefinedValues") {
          return [ValueOrUndefined<Double>.value(unwrapped: 1.0), .undefined]
        }

        Function("returnDictionaryOfUndefinedValues") {
          return [
            "present": ValueOrUndefined<Double>.value(unwrapped: 1.0),
            "missing": .undefined
          ]
        }

        Function("returnEncodable") {
          return TestEncodable(name: "Expo SDK", version: 55)
        }

        Function("withSharedObject") {
          return SharedString("Test")
        }

        AsyncFunction("withSharedObjectAsync") {
          return SharedString("Test")
        }

        AsyncFunction("withArrayOfSharedObjectsAsync") {
          return [SharedString("Test1"), SharedString("Test2"), SharedString("Test3")]
        }

        AsyncFunction("withSharedObjectPromise") { (p: Promise) in
          p.resolve(SharedString("Test with Promise"))
        }

        Function("returnBaseSharedRef") {
          return BaseSharedRef(1.2)
        }

        Function("withEither") { (either: Either<Bool, String>) in
          return either
        }

        AsyncFunction("withURLAsync") {
          return TestURLRecord.defaultURL
        }

        AsyncFunction("withUndefinedAsync") {
          return WithUndefinedRecord()
        }

        AsyncFunction("withNestedURLAsync") {
          return TestURLRecord()
        }

        Function("withArrayOfArrays") { (a: [[String]]) -> String in
          return a.first!.first!
        }

        Function("withTrailingOptionals") { (a: String, b: Int?, c: Bool?) -> String in
          return c == nil ? "c was nil" : "c was set"
        }

        Function("withOneArg") { (a: Int) -> String in
          return "got \(a)"
        }

        Function("expectsString") { (a: String) -> String in
          return a
        }

        Function("withRecordAndCustomKey") { (a: TestRecord) -> String in
          return a.property
        }

        Class("Shared", SharedString.self) {
          Property("value") { shared in
            return shared.ref
          }
        }
      })
    }

    @Test
    func `returns values`() throws {
      #expect(try runtime.eval("expo.modules.TestModule.returnPi()").asDouble() == Double.pi)
      #expect(try runtime.eval("expo.modules.TestModule.returnNull()").isNull() == true)
      #expect(try runtime.eval("expo.modules.TestModule.returnUndefined()").isUndefined() == true)
    }

    @Test
    func `accepts optional arguments`() throws {
      #expect(try runtime.eval("expo.modules.TestModule.isArgNull(3.14)").asBool() == false)
      #expect(try runtime.eval("expo.modules.TestModule.isArgNull(null)").asBool() == true)
    }

    @Test
    func `returns object made from definition`() throws {
      let initialValue = Int.random(in: 1..<100)
      let object = try runtime.eval("object = expo.modules.TestModule.returnObjectDefinition(\(initialValue))")

      #expect(object.kind == .object)
      #expect(object.getObject().hasProperty("increment") == true)

      let result = try runtime.eval("object.increment()")

      #expect(result.kind == .number)
      #expect(result.getInt() == initialValue + 1)
    }

    @Test
    func `takes JavaScriptFunction argument`() throws {
      let value = try runtime.eval("expo.modules.TestModule.withFunction((a, b) => a + b)")

      #expect(value.kind == .string)
      #expect(value.getString() == "foobar")
    }

    @Test
    func `accepts CGFloat argument`() throws {
      #expect(try runtime.eval("expo.modules.TestModule.withCGFloat(20.23)").asString() == "20.23")
    }

    @Test
    func `accepts record`() throws {
      #expect(try runtime.eval("expo.modules.TestModule.withRecord({property: \"123\"})").asString() == "123")
    }

    @Test
    func `accepts record while ignoring extra function-valued properties`() throws {
      #expect(
        try runtime.eval("""
          expo.modules.TestModule.withRecord({
            property: "123",
            signal: {
              addEventListener() {}
            }
          })
        """).asString() == "123"
      )
    }

    @Test
    func `accepts record while treating undefined field values as missing`() throws {
      #expect(
        try runtime.eval("""
          expo.modules.TestModule.withRecord({
            property: undefined
          })
        """).asString() == "expo"
      )
    }

    @Test
    func `throws FieldRequiredException when a non-optional record field is null`() throws {
      #expect {
        try runtime.eval("""
          expo.modules.TestModule.withRecord({
            property: null
          })
        """)
      } throws: { error in
        guard let evalError = error as? ScriptEvaluationError else {
          return false
        }
        return evalError.message.contains("FieldRequiredException: Value for field 'property' is required, got nil")
      }
    }

    @Test
    func `accepts record while dropping undefined values from nested dictionaries`() throws {
      #expect(
        try runtime.eval("""
          expo.modules.TestModule.withRecordWithHeaders({
            headers: {
              authorization: undefined
            }
          })
        """).asString() == "0"
      )
    }

    @Test
    func `accepts no optional record`() throws {
      #expect(try runtime.eval("expo.modules.TestModule.withOptionalRecord()").asString() == "no value")
    }

    @Test
    func `accepts optional record`() throws {
      #expect(try runtime.eval("expo.modules.TestModule.withOptionalRecord({property: \"123\"})").asString() == "123")
    }

    @Test
    func `accepts nullable ValueOrUndefinded`() throws {
      try runtime.eval("expo.modules.TestModule.withNullableValueOrUndefinded({a: null})")
    }

    @Test
    func `accepts nullable ValueOrUndefinded in array`() throws {
      try runtime.eval("expo.modules.TestModule.withNullableValueOrUndefindedInArray([null, undefined])")
    }

    @Test
    func `returns array with ValueOrUndefined without double-converting`() throws {
      try runtime.eval("""
        globalThis.result = expo.modules.TestModule.returnArrayOfUndefinedValues()
      """)

      #expect(try runtime.eval("result.length").asInt() == 2)
      #expect(try runtime.eval("result[0]").asDouble() == 1.0)
      #expect(try runtime.eval("result[1]").isUndefined() == true)
    }

    @Test
    func `returns dictionary with ValueOrUndefined without double-converting`() throws {
      try runtime.eval("""
        globalThis.result = expo.modules.TestModule.returnDictionaryOfUndefinedValues()
      """)

      #expect(try runtime.eval("result.present").asDouble() == 1.0)
      #expect(try runtime.eval("result.missing").isUndefined() == true)
      #expect(try runtime.eval("Object.prototype.hasOwnProperty.call(result, 'missing')").asBool() == true)
    }

    @Test
    func `returns encodable struct`() throws {
      let result = try runtime.eval("expo.modules.TestModule.returnEncodable()")
      #expect(result.kind == .object)
      #expect(result.getObject().getPropertyNames().contains("name"))
      #expect(result.getObject().getPropertyNames().contains("version"))
      #expect(try result.getObject().getProperty("name").asString() == "Expo SDK")
      #expect(try result.getObject().getProperty("version").asInt() == 55)
    }

    @Test
    func `returns URL (sync)`() throws {
      let result = try runtime.eval("globalThis.result = expo.modules.TestModule.withURL()")
      #expect(result.kind == .string)
      #expect(result.getString() == TestURLRecord.defaultURLString)
    }

    @Test
    func `returns URL (async)`() async throws {
      try runtime.eval("expo.modules.TestModule.withURLAsync().then((result) => { globalThis.result = result; })")
      try await waitUntil(timeout: 2.0) {
        safeBoolEval("!!globalThis.result")
      }

      let urlValue = try runtime.eval("url = globalThis.result")
      #expect(urlValue.kind == .string)
      #expect(urlValue.getString() == TestURLRecord.defaultURLString)
    }

    @Test
    func `returns value or undefined (sync)`() throws {
      let object = try runtime.eval("globalThis.result = expo.modules.TestModule.withUndefined()")
      #expect(object.kind == .object)

      #expect(object.getObject().hasProperty("a") == true)
      #expect(object.getObject().getProperty("a").kind == .number)
      #expect(object.getObject().getProperty("a").getDouble() == 1.0)

      #expect(object.getObject().hasProperty("b") == true)
      #expect(object.getObject().getProperty("b").kind == .undefined)
    }

    @Test
    func `returns value or undefined (async)`() async throws {
      try runtime.eval("expo.modules.TestModule.withUndefinedAsync().then((result) => { globalThis.result = result; })")
      try await waitUntil(timeout: 2.0) {
        safeBoolEval("!!globalThis.result")
      }

      let object = try runtime.eval("object = globalThis.result")
      #expect(object.kind == .object)

      #expect(object.getObject().hasProperty("a") == true)
      #expect(object.getObject().getProperty("a").kind == .number)
      #expect(object.getObject().getProperty("a").getDouble() == 1.0)

      #expect(object.getObject().hasProperty("b") == true)
      #expect(object.getObject().getProperty("b").kind == .undefined)
    }

    @Test
    func `returns a record with url (sync)`() throws {
      let object = try runtime.eval("globalThis.result = expo.modules.TestModule.withNestedURL()")
      #expect(object.kind == .object)
      #expect(object.getObject().hasProperty("url") == true)
      #expect(object.getObject().getProperty("url").getString() == TestURLRecord.defaultURLString)
    }

    @Test
    func `returns a record with url (async)`() async throws {
      try runtime.eval("expo.modules.TestModule.withNestedURLAsync().then((result) => { globalThis.result = result; })")

      try await waitUntil(timeout: 2.0) {
        safeBoolEval("!!globalThis.result.url")
      }

      let object = try runtime.eval("object = globalThis.result")
      #expect(object.kind == .object)
      #expect(object.getObject().hasProperty("url") == true)

      let urlValue = try runtime.eval("object.url")
      #expect(urlValue.kind == .string)
      #expect(urlValue.getString() == TestURLRecord.defaultURLString)
    }

    @Test
    func `returns a SharedObject (sync)`() throws {
      let object = try runtime.eval("expo.modules.TestModule.withSharedObject()")

      #expect(object.kind == .object)
      #expect(object.getObject().hasProperty("value") == true)
      #expect(object.getObject().getProperty("value").getString() == "Test")
    }

    @Test
    func `returns a SharedObject (async)`() async throws {
      try runtime
        .eval(
          "expo.modules.TestModule.withSharedObjectAsync().then((result) => { globalThis.result = result; })"
        )

      try await waitUntil(timeout: 4.0) {
        safeBoolEval("globalThis.result != null")
      }
      let object = try runtime.eval("object = globalThis.result")

      #expect(object.kind == .object)
      #expect(object.getObject().hasProperty("value") == true)

      let result = try runtime.eval("object.value")
      #expect(result.kind == .string)
      #expect(result.getString() == "Test")
    }

    @Test
    func `returns an Array of SharedObjects (async)`() async throws {
      try runtime
        .eval(
          "expo.modules.TestModule.withArrayOfSharedObjectsAsync().then((result) => { globalThis.resultArray = result; })"
        )

      try await waitUntil(timeout: 2.0) {
        safeBoolEval("globalThis.resultArray != null")
      }
      let object = try runtime.eval("object = globalThis.resultArray")

      #expect(object.kind == .object)
      #expect(object.getObject().hasProperty("length") == true)

      let result = object.getArray()
      for (index, element) in result.enumerated() {
        #expect(element.kind == .object)
        #expect(element.getObject().hasProperty("value") == true)
        let value = try runtime.eval("object[\(index)].value")
        #expect(value.kind == .string)
        #expect(value.getString() == "Test\(index + 1)")
      }
    }

    @Test
    func `returns a SharedObject with Promise`() async throws {
      try runtime
        .eval(
          "expo.modules.TestModule.withSharedObjectPromise().then((result) => { globalThis.promiseResult = result; })"
        )

      try await waitUntil(timeout: 2.0) {
        safeBoolEval("globalThis.promiseResult != null")
      }
      let object = try runtime.eval("object = globalThis.promiseResult")

      #expect(object.kind == .object)
      #expect(object.getObject().hasProperty("value") == true)

      let result = try runtime.eval("object.value")
      #expect(result.kind == .string)
      #expect(result.getString() == "Test with Promise")
    }

    @Test
    func `returns shared ref without the Class definition`() throws {
      // In this case the native shared ref type is not defined as a class in the module's definition.
      // Nevertheless, it should be converted to JS object that is an instance of the base `SharedRef` class.
      let isSharedRef = try runtime.eval("expo.modules.TestModule.returnBaseSharedRef() instanceof expo.SharedRef")

      #expect(isSharedRef.kind == .bool)
      #expect(isSharedRef.getBool() == true)
    }

    @Test
    func `accepts and returns Either value`() throws {
      let stringResult = try runtime.eval("expo.modules.TestModule.withEither('test string')")
      #expect(stringResult.kind == .string)
      #expect(stringResult.getString() == "test string")

      let boolResult = try runtime.eval("expo.modules.TestModule.withEither(true)")
      #expect(boolResult.kind == .bool)
      #expect(boolResult.getBool() == true)
    }

    // MARK: - Argument handling

    @Test
    func `accepts an array of arrays`() throws {
      let result = try runtime.eval("expo.modules.TestModule.withArrayOfArrays([['expo']])")
      #expect(try result.asString() == "expo")
    }

    @Test
    func `allows to skip trailing optional arguments`() throws {
      let result = try runtime.eval("expo.modules.TestModule.withTrailingOptionals('test')")
      #expect(try result.asString() == "c was nil")
    }

    @Test
    func `throws when called with more arguments than expected`() throws {
      #expect(throws: (any Error).self) {
        try runtime.eval("expo.modules.TestModule.withOneArg(1, 2)")
      }
    }

    @Test
    func `throws when called without required arguments`() throws {
      #expect(throws: (any Error).self) {
        try runtime.eval("expo.modules.TestModule.withOneArg()")
      }
    }

    @Test
    func `returns record with correct properties`() throws {
      let result = try runtime.eval("expo.modules.TestModule.withRecordAndCustomKey({property: 'Hello'})")
      #expect(try result.asString() == "Hello")
    }

    // MARK: - Helpers

    private func safeBoolEval(_ js: String) -> Bool {
      var result = false
      do {
        try EXUtilities.catchException {
          guard let jsResult = try? self.runtime.eval(js) else {
            return
          }
          result = jsResult.getBool()
        }
      } catch {
        return false
      }
      return result
    }

    private func waitUntil(timeout: TimeInterval, condition: @escaping () -> Bool) async throws {
      let start = Date()
      while !condition() {
        if Date().timeIntervalSince(start) > timeout {
          throw TestError.timeout
        }
        try await Task.sleep(nanoseconds: 50_000_000) // 50ms
      }
    }
  }
}

private enum TestError: Error {
  case timeout
}

private class SharedString: SharedRef<String> {
  override var nativeRefType: String {
    "string"
  }
}

private class BaseSharedRef: SharedRef<Double> {
  override var nativeRefType: String {
    "none"
  }
}

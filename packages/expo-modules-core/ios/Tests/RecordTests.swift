// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

@testable import ExpoModulesCore

// Records synthesized by the `@Record` macro — every stored property is part of the record, with no
// `@Field` wrapper. Declared at file scope so the macro's `extension … : Record {}` is emitted in a
// top-level context.

@Record
struct SynthesizedPointRecord {
  var x: Double = 0
  var y: Double = 0
}

@Record
struct SynthesizedMixedRecord {
  // Required: non-optional, no default — the source must provide it.
  var name: String
  // Optional via default — the default applies when the source omits it.
  var count: Int = 7
  // Nullable + optional — becomes `nil` when the source omits it or sends null.
  var note: String?
}

enum SynthesizedStatus: String, Enumerable {
  case active
  case inactive
}

@Record
struct SynthesizedEnumRecord {
  var status: SynthesizedStatus = .inactive
}

@Suite("Record")
struct RecordTests {

  @Suite("Field")
  struct FieldTests {
    let appContext = AppContext.create()

    @Test
    func `initializes with empty dictionary`() throws {
      struct TestRecord: Record { }
      _ = try TestRecord(from: [:], appContext: appContext)
    }

    @Test
    func `works back and forth with a field`() throws {
      struct TestRecord: Record {
        @Field var a: String?
      }
      let dict = ["a": "b"]
      let record = try TestRecord(from: dict, appContext: appContext)

      #expect(record.a == dict["a"])
      #expect(record.toDictionary()["a"] as? String == dict["a"]!)
    }

    @Test
    func `works back and forth with an enum`() throws {
      enum StringEnum: String, Enumerable {
        case deleted
        case created
      }
      enum IntEnum: Int, Enumerable {
        case one = 1
        case two
      }
      struct TestRecord: Record {
        @Field var a: StringEnum = .created
        @Field var b: IntEnum?
      }
      let dict: [String: Any] = ["a": "deleted", "b": 1]
      let record = try TestRecord(from: dict, appContext: appContext)

      #expect(record.a == StringEnum.deleted)
      #expect(record.b == IntEnum.one)

      #expect(record.toDictionary()["a"] as? String == dict["a"]! as? String)
      #expect(record.toDictionary()["b"] as? Int == dict["b"]! as? Int)
    }

    @Test
    func `works back and forth with ValueOrUndefined`() throws {
      struct TestRecord: Record {
        @Field var a: ValueOrUndefined<Double> = .value(unwrapped: 1.0)
        @Field var b: ValueOrUndefined<Double> = .undefined
      }
      let record = try TestRecord(from: [:], appContext: appContext)

      #expect(record.a.optional == 1.0)
      #expect(record.b.isUndefined == true)

      let asDict = record.toDictionary(appContext: appContext)
      #expect(asDict["a"] as? Double == 1.0)
      #expect((asDict["b"] as? ConvertedJavaScriptValue)?.takeValue().kind == .undefined)
    }

    @Test
    func `works back and forth with Either`() throws {
      struct TestRecord: Record {
        @Field var stringValue: Either<Bool, String>?
        @Field var boolValue: Either<Bool, String>?
        @Field var intValue: Either<Int, String>?
        @Field var nilValue: Either<Int, String>?
      }
      let dict: [String: Any] = [
        "stringValue": "custom",
        "boolValue": true,
        "intValue": 42,
      ]
      let record = try TestRecord(from: dict, appContext: appContext)
      #expect(record.stringValue?.get() as String? == "custom")
      #expect(record.boolValue?.get() as Bool? == true)
      #expect(record.intValue?.get() as Int? == 42)
      #expect(record.nilValue == nil)

      let asDict = record.toDictionary(appContext: appContext)
      #expect(asDict["stringValue"] as? String == "custom")
      #expect(asDict["boolValue"] as? Bool == true)
      #expect(asDict["intValue"] as? Int == 42)
      #expect(asDict["nilValue"] as? Int == nil)
    }

    @Test
    func `works back and forth with a keyed field`() throws {
      struct TestRecord: Record {
        @Field("key") var a: String?
      }
      let dict = ["key": "b"]
      let record = try TestRecord(from: dict, appContext: appContext)

      #expect(record.a == dict["key"])
      #expect(record.toDictionary()["key"] as? String == dict["key"]!)
    }

    @Test
    func `throws when required field is missing`() throws {
      struct TestRecord: Record {
        @Field(.required) var a: Int
      }

      #expect(throws: FieldRequiredException.self) {
        try TestRecord(from: [:], appContext: appContext)
      }
    }

    @Test
    func `throws when casting is not possible`() throws {
      struct TestRecord: Record {
        @Field var a: Int
      }
      let dict = ["a": "try with String instead of Int"]

      #expect(throws: FieldInvalidTypeException.self) {
        try TestRecord(from: dict, appContext: appContext)
      }
    }

    @Test
    func `serializes concurrently on a shared record without crashing`() {
      struct StressRecord: Record {
        @Field var a: String? = nil
        @Field var b: String? = nil
        @Field var c: String? = nil
      }

      let record = StressRecord(a: "a", b: "b", c: "c")
      let workers = 16
      let iterations = 100
      let group = DispatchGroup()
      let startGate = DispatchSemaphore(value: 0)

      for _ in 0..<workers {
        group.enter()
        DispatchQueue.global(qos: .userInitiated).async {
          startGate.wait()
          for _ in 0..<iterations {
            _ = record.toDictionary()
          }
          group.leave()
        }
      }
      // Release every worker so they collide on the first reflection.
      for _ in 0..<workers { startGate.signal() }
      group.wait()

      let finalDict = record.toDictionary()
      #expect(finalDict.keys.count == 3)
      #expect(finalDict["a"] as? String == "a")
      #expect(finalDict["c"] as? String == "c")
    }
  }

  @Suite("SynthesizedRecord")
  @JavaScriptActor
  struct SynthesizedRecordTests {
    let appContext = AppContext.create()

    var runtime: ExpoRuntime {
      get throws {
        try appContext.runtime
      }
    }

    @Test
    func `every stored property is part of the record without @Field`() throws {
      let record = try SynthesizedMixedRecord.decode(
        runtime.eval("({ name: 'alpha', count: 3, note: 'hi' })"),
        in: runtime
      )

      #expect(record.name == "alpha")
      #expect(record.count == 3)
      #expect(record.note == "hi")
    }

    @Test
    func `defaulted property falls back to its declared default when omitted`() throws {
      let record = try SynthesizedMixedRecord.decode(runtime.eval("({ name: 'alpha' })"), in: runtime)

      #expect(record.name == "alpha")
      #expect(record.count == 7)
      #expect(record.note == nil)
    }

    @Test
    func `missing required property throws RecordPropertyRequiredException`() throws {
      let object = try runtime.eval("({})")
      #expect(throws: RecordPropertyRequiredException.self) {
        try SynthesizedMixedRecord.decode(object, in: try runtime)
      }
    }

    @Test
    func `toDictionary puts every property in the dictionary`() {
      let record = SynthesizedMixedRecord(name: "alpha", count: 3, note: "hi")
      let dictionary = record.toDictionary(appContext: appContext)

      #expect(dictionary["name"] as? String == "alpha")
      #expect(dictionary["count"] as? Int == 3)
      #expect(dictionary["note"] as? String == "hi")
    }

    @Test
    func `all-defaulted struct decodes from an empty object`() throws {
      let record = try SynthesizedPointRecord.decode(runtime.eval("({})"), in: runtime)

      #expect(record.x == 0)
      #expect(record.y == 0)
    }

    @Test
    func `is usable wherever a Record is expected`() throws {
      // The macro auto-conforms to `Record`, so the type satisfies a `Record`-constrained generic and
      // its synthesized `from(object:)` overrides the reflection-based default.
      func acceptsRecord<T: Record>(_ type: T.Type, from object: borrowing JavaScriptObject) throws -> T {
        return try type.from(object: object, appContext: appContext)
      }

      let record = try acceptsRecord(SynthesizedPointRecord.self, from: runtime.eval("({ x: 1.5, y: 2.5 })").asObject())
      #expect(record.x == 1.5)
      #expect(record.y == 2.5)
    }

    @Test
    func `optional property reads explicit null as nil`() throws {
      let omitted = try SynthesizedMixedRecord.decode(runtime.eval("({ name: 'a' })"), in: runtime)
      let explicitNull = try SynthesizedMixedRecord.decode(runtime.eval("({ name: 'a', note: null })"), in: runtime)

      #expect(omitted.note == nil)
      #expect(explicitNull.note == nil)
    }

    @Test
    func `can't be created from a native dictionary`() {
      // A record converts only from JavaScript values. A dictionary that reaches it through
      // `Convertible.convert(from:)` routes to the synthesized `from(dictionary:)`, which throws.
      let dynamicType = SynthesizedPointRecord.getDynamicType()
      #expect(throws: RecordDictionaryConversionException.self) {
        try dynamicType.cast(["x": 1.5, "y": 2.5], appContext: appContext)
      }
    }

    @Test
    func `decodes an enum property from its raw value`() throws {
      let active = try SynthesizedEnumRecord.decode(runtime.eval("({ status: 'active' })"), in: runtime)
      let defaulted = try SynthesizedEnumRecord.decode(runtime.eval("({})"), in: runtime)

      #expect(active.status == .active)
      #expect(defaulted.status == .inactive)
    }

    @Suite("JavaScript")
    @JavaScriptActor
    struct JavaScriptTests {
      let appContext: AppContext
      var runtime: ExpoRuntime {
        get throws {
          try appContext.runtime
        }
      }

      init() {
        appContext = AppContext.create()

        appContext.moduleRegistry.register(holder: mockModuleHolder(appContext) {
          Name("RecordTestModule")

          Function("passthrough") { (point: SynthesizedPointRecord) in
            return point
          }
        })
      }

      // Round-trips a synthesized record through JS: the argument exercises `from(object:)` and the
      // return value exercises the direct `toObject` path.
      @Test
      func `passes through JavaScript via a function`() throws {
        try runtime.eval("result = expo.modules.RecordTestModule.passthrough({ x: 1.5, y: 2.5 })")

        #expect(try runtime.eval("result.x").asDouble() == 1.5)
        #expect(try runtime.eval("result.y").asDouble() == 2.5)
      }
    }
  }
}

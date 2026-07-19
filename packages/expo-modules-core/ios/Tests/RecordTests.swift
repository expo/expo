// Copyright 2026-present 650 Industries. All rights reserved.

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
      let dict = ["a": "deleted", "b": 1]
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
      #expect((asDict["b"] as? JavaScriptValue)?.kind == .undefined)
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
  struct SynthesizedRecordTests {
    let appContext = AppContext.create()

    @Test
    func `every stored property is part of the record without @Field`() throws {
      let record = try SynthesizedMixedRecord.from(
        dictionary: ["name": "alpha", "count": 3, "note": "hi"],
        appContext: appContext
      )

      #expect(record.name == "alpha")
      #expect(record.count == 3)
      #expect(record.note == "hi")
    }

    @Test
    func `defaulted property falls back to its declared default when omitted`() throws {
      let record = try SynthesizedMixedRecord.from(
        dictionary: ["name": "alpha"],
        appContext: appContext
      )

      #expect(record.name == "alpha")
      #expect(record.count == 7)
      #expect(record.note == nil)
    }

    @Test
    func `missing required property throws RecordPropertyRequiredException`() {
      #expect(throws: RecordPropertyRequiredException.self) {
        try SynthesizedMixedRecord.from(dictionary: [:], appContext: appContext)
      }
    }

    @Test
    func `toDictionary round-trips every property`() throws {
      let record = try SynthesizedMixedRecord.from(
        dictionary: ["name": "alpha", "count": 3, "note": "hi"],
        appContext: appContext
      )
      let dictionary = record.toDictionary(appContext: appContext)

      #expect(dictionary["name"] as? String == "alpha")
      #expect(dictionary["count"] as? Int == 3)
      #expect(dictionary["note"] as? String == "hi")
    }

    @Test
    func `all-defaulted struct constructs from an empty dictionary`() throws {
      let record = try SynthesizedPointRecord.from(dictionary: [:], appContext: appContext)

      #expect(record.x == 0)
      #expect(record.y == 0)
    }

    @Test
    func `is usable wherever a Record is expected`() throws {
      // The macro auto-conforms to `Record`, so the type satisfies a `Record`-constrained generic and
      // its synthesized `from(dictionary:)` overrides the reflection-based default.
      func acceptsRecord<T: Record>(_ type: T.Type, from dictionary: [String: Any]) throws -> T {
        return try type.from(dictionary: dictionary, appContext: appContext)
      }

      let record = try acceptsRecord(SynthesizedPointRecord.self, from: ["x": 1.5, "y": 2.5])
      #expect(record.x == 1.5)
      #expect(record.y == 2.5)
    }

    @Test
    func `optional property reads explicit null as nil`() throws {
      let omitted = try SynthesizedMixedRecord.from(dictionary: ["name": "a"], appContext: appContext)
      let explicitNull = try SynthesizedMixedRecord.from(
        dictionary: ["name": "a", "note": NSNull()],
        appContext: appContext
      )

      #expect(omitted.note == nil)
      #expect(explicitNull.note == nil)
    }

    @Test
    func `converts from a dictionary value via the Convertible entry point`() throws {
      // A record nested inside a `[String: Any]` is hydrated through `Convertible.convert(from:)`,
      // which routes to the synthesized `from(dictionary:)` rather than the reflection default.
      let dynamicType = SynthesizedPointRecord.getDynamicType()
      let value = try dynamicType.cast(["x": 1.5, "y": 2.5], appContext: appContext)
      let record = try #require(value as? SynthesizedPointRecord)

      #expect(record.x == 1.5)
      #expect(record.y == 2.5)
    }

    @Test
    func `reads an enum property through its dynamic type`() throws {
      // Exercises `getDynamicType().cast` for a non-primitive property type — the enum's raw value is
      // coerced back to the case rather than passed through verbatim.
      let active = try SynthesizedEnumRecord.from(dictionary: ["status": "active"], appContext: appContext)
      let defaulted = try SynthesizedEnumRecord.from(dictionary: [:], appContext: appContext)

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

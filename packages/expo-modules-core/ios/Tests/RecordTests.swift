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

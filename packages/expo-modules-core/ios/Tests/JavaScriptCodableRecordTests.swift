// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
import ExpoModulesJSI

@testable import ExpoModulesCore

// A record synthesized by the `@Record` macro, declared at file scope so the macro emits its
// `extension … : Record {}` in a top-level context.
@Record
struct CodablePoint: Equatable {
  var x: Double = 0
  var y: Double = 0
}

// Covers the optional/nullable field shape: `label` is nullable-and-optional, `note` optional with a
// default. Neither is required, so both may be omitted from the source object.
@Record
struct CodableLabeledPoint: Equatable {
  var x: Double = 0
  var label: String? = nil
  var note: String = "unset"
}

// Covers a required field (non-optional, no default). `from(object:)` throws when it is omitted.
@Record
struct CodableRequiredPoint: Equatable {
  var x: Double
  var y: Double = 0
}

// Covers a record whose field is itself a record, exercising nested `from(object:)`/`toObject()`.
@Record
struct CodableLine: Equatable {
  var start: CodablePoint = CodablePoint()
  var end: CodablePoint = CodablePoint()
}

// Covers non-`Double` field types in one place: string, int, bool, array, and dictionary.
@Record
struct CodableMixed: Equatable {
  var name: String = ""
  var count: Int = 0
  var enabled: Bool = false
  var tags: [String] = []
  var scores: [String: Int] = [:]
}

// Covers the zero-field boundary: the field-iteration loops run over nothing.
@Record
struct CodableEmpty: Equatable {}

@Suite("JavaScriptCodable+Record")
@JavaScriptActor
struct JavaScriptCodableRecordTests {
  let appContext = AppContext.create()

  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  @Test
  func `decodes a record from a JS object`() throws {
    let runtime = try runtime
    let value = try runtime.eval("({ x: 1.5, y: 2.5 })")
    let decoded = try CodablePoint.decode(value, in: runtime)
    #expect(decoded == CodablePoint(x: 1.5, y: 2.5))
  }

  @Test
  func `encodes a record to a JS object`() throws {
    let runtime = try runtime
    let encoded = try CodablePoint.encode(CodablePoint(x: 3, y: 4), in: runtime)
    let object = encoded.getObject()
    #expect(object.getProperty("x").getDouble() == 3)
    #expect(object.getProperty("y").getDouble() == 4)
  }

  @Test
  func `round-trips a record`() throws {
    let runtime = try runtime
    let value = try runtime.eval("({ x: 10, y: 20 })")
    let decoded = try CodablePoint.decode(value, in: runtime)
    let reencoded = try CodablePoint.encode(decoded, in: runtime)
    let object = reencoded.getObject()
    #expect(object.getProperty("x").getDouble() == 10)
    #expect(object.getProperty("y").getDouble() == 20)
  }

  @Test
  func `decodes a record nested in an array`() throws {
    let runtime = try runtime
    let value = try runtime.eval("[{ x: 1, y: 1 }, { x: 2, y: 2 }]")
    let decoded = try [CodablePoint].decode(value, in: runtime)
    #expect(decoded == [CodablePoint(x: 1, y: 1), CodablePoint(x: 2, y: 2)])
  }

  // MARK: - App context recovery

  @Test
  func `record decode throws when the runtime has no app context`() throws {
    // A bare runtime is not prepared by an app context, so its `global.expo` carries no native
    // state and `AppContext.from(runtime:)` cannot recover one. The legacy record converters need
    // the context, so the conversion throws rather than proceed without it.
    let bareRuntime = JavaScriptRuntime()
    let value = try bareRuntime.eval("({ x: 1, y: 2 })")
    #expect(throws: Exceptions.AppContextNotFound.self) {
      _ = try CodablePoint.decode(value, in: bareRuntime)
    }
  }

  @Test
  func `record encode throws when the runtime has no app context`() throws {
    let bareRuntime = JavaScriptRuntime()
    #expect(throws: Exceptions.AppContextNotFound.self) {
      _ = try CodablePoint.encode(CodablePoint(x: 1, y: 2), in: bareRuntime)
    }
  }

  // MARK: - Optional and nullable fields

  @Test
  func `round-trips a record whose optional field is set`() throws {
    let runtime = try runtime
    let value = try runtime.eval("({ x: 1, label: 'a', note: 'b' })")
    let decoded = try CodableLabeledPoint.decode(value, in: runtime)
    #expect(decoded == CodableLabeledPoint(x: 1, label: "a", note: "b"))
    let reencoded = try CodableLabeledPoint.encode(decoded, in: runtime)
    let object = reencoded.getObject()
    #expect(object.getProperty("label").getString() == "a")
    #expect(object.getProperty("note").getString() == "b")
  }

  @Test
  func `encodes a nil optional field as JS null`() throws {
    let runtime = try runtime
    let encoded = try CodableLabeledPoint.encode(CodableLabeledPoint(x: 1, label: nil, note: "b"), in: runtime)
    #expect(encoded.getObject().getProperty("label").isNull())
  }

  @Test
  func `decodes a null optional field as nil`() throws {
    let runtime = try runtime
    let value = try runtime.eval("({ x: 1, label: null, note: 'b' })")
    let decoded = try CodableLabeledPoint.decode(value, in: runtime)
    #expect(decoded.label == nil)
  }

  @Test
  func `keeps the declared default when an optional field is omitted`() throws {
    let runtime = try runtime
    let value = try runtime.eval("({ x: 1 })")
    let decoded = try CodableLabeledPoint.decode(value, in: runtime)
    #expect(decoded.label == nil)
    #expect(decoded.note == "unset")
  }

  // MARK: - Required fields and conversion errors

  @Test
  func `decode throws when a required field is missing`() throws {
    let runtime = try runtime
    let value = try runtime.eval("({ y: 2 })")
    #expect(throws: (any Error).self) {
      _ = try CodableRequiredPoint.decode(value, in: runtime)
    }
  }

  @Test
  func `decode throws when a field has the wrong type`() throws {
    let runtime = try runtime
    let value = try runtime.eval("({ x: 'not a number', y: 2 })")
    #expect(throws: (any Error).self) {
      _ = try CodablePoint.decode(value, in: runtime)
    }
  }

  // MARK: - Nested and multi-type fields

  @Test
  func `round-trips a record containing a nested record`() throws {
    let runtime = try runtime
    let value = try runtime.eval("({ start: { x: 1, y: 2 }, end: { x: 3, y: 4 } })")
    let decoded = try CodableLine.decode(value, in: runtime)
    #expect(decoded == CodableLine(start: CodablePoint(x: 1, y: 2), end: CodablePoint(x: 3, y: 4)))
    let reencoded = try CodableLine.encode(decoded, in: runtime)
    let start = reencoded.getObject().getProperty("start").getObject()
    #expect(start.getProperty("x").getDouble() == 1)
    #expect(start.getProperty("y").getDouble() == 2)
  }

  @Test
  func `round-trips a record with string, int, bool, array and dictionary fields`() throws {
    let runtime = try runtime
    let value = try runtime.eval("({ name: 'a', count: 3, enabled: true, tags: ['x', 'y'], scores: { a: 1 } })")
    let decoded = try CodableMixed.decode(value, in: runtime)
    #expect(decoded == CodableMixed(name: "a", count: 3, enabled: true, tags: ["x", "y"], scores: ["a": 1]))
    let reencoded = try CodableMixed.encode(decoded, in: runtime)
    let object = reencoded.getObject()
    #expect(object.getProperty("name").getString() == "a")
    #expect(object.getProperty("count").getInt() == 3)
    #expect(object.getProperty("enabled").getBool() == true)
    #expect(object.getProperty("tags").getArray().length == 2)
    #expect(object.getProperty("scores").getObject().getProperty("a").getInt() == 1)
  }

  // MARK: - Empty record

  @Test
  func `round-trips an empty record`() throws {
    let runtime = try runtime
    let value = try runtime.eval("({})")
    let decoded = try CodableEmpty.decode(value, in: runtime)
    #expect(decoded == CodableEmpty())
    let reencoded = try CodableEmpty.encode(decoded, in: runtime)
    #expect(reencoded.isObject())
  }
}

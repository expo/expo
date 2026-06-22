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
}

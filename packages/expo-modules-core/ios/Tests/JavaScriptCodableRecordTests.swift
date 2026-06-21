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
    let decoded = try CodablePoint.decode(value, appContext: appContext, runtime: runtime)
    #expect(decoded == CodablePoint(x: 1.5, y: 2.5))
  }

  @Test
  func `encodes a record to a JS object`() throws {
    let runtime = try runtime
    let encoded = try CodablePoint.encode(CodablePoint(x: 3, y: 4), appContext: appContext, runtime: runtime)
    let object = encoded.getObject()
    #expect(object.getProperty("x").getDouble() == 3)
    #expect(object.getProperty("y").getDouble() == 4)
  }

  @Test
  func `round-trips a record`() throws {
    let runtime = try runtime
    let value = try runtime.eval("({ x: 10, y: 20 })")
    let decoded = try CodablePoint.decode(value, appContext: appContext, runtime: runtime)
    let reencoded = try CodablePoint.encode(decoded, appContext: appContext, runtime: runtime)
    let object = reencoded.getObject()
    #expect(object.getProperty("x").getDouble() == 10)
    #expect(object.getProperty("y").getDouble() == 20)
  }

  @Test
  func `decodes a record nested in an array`() throws {
    let runtime = try runtime
    let value = try runtime.eval("[{ x: 1, y: 1 }, { x: 2, y: 2 }]")
    let decoded = try [CodablePoint].decode(value, appContext: appContext, runtime: runtime)
    #expect(decoded == [CodablePoint(x: 1, y: 1), CodablePoint(x: 2, y: 2)])
  }
}

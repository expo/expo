// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
import ExpoModulesJSI

@testable import ExpoModulesCore

enum CodableColor: String, Enumerable {
  case red
  case green
}

enum CodablePriority: Int, Enumerable {
  case low = 1
  case high = 2
}

@Suite("JavaScriptCodable+Enumerable")
@JavaScriptActor
struct JavaScriptCodableEnumerableTests {
  let appContext = AppContext.create()

  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  // MARK: - String-backed enum

  @Test
  func `decodes and encodes a string enum`() throws {
    let runtime = try runtime
    let decoded = try CodableColor.decode(runtime.eval("'green'"), appContext: appContext, runtime: runtime)
    #expect(decoded == .green)
    let encoded = try CodableColor.encode(.red, appContext: appContext, runtime: runtime)
    #expect(encoded.getString() == "red")
  }

  // MARK: - Int-backed enum

  @Test
  func `decodes and encodes an int enum`() throws {
    let runtime = try runtime
    let decoded = try CodablePriority.decode(runtime.eval("2"), appContext: appContext, runtime: runtime)
    #expect(decoded == .high)
    let encoded = try CodablePriority.encode(.low, appContext: appContext, runtime: runtime)
    #expect(encoded.getInt() == 1)
  }

  // MARK: - Error paths

  @Test
  func `enum decode throws on an unknown raw value`() throws {
    let runtime = try runtime
    #expect(throws: (any Error).self) {
      _ = try CodableColor.decode(runtime.eval("'purple'"), appContext: appContext, runtime: runtime)
    }
  }
}

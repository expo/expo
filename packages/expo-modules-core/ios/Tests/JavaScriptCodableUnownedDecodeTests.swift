// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

@testable import ExpoModulesCore

/// Decodes the core types through the `JavaScriptUnownedValue` overload.
@Suite("JavaScriptDecodable unowned decode in core")
@JavaScriptActor
struct JavaScriptCodableUnownedDecodeTests {
  let appContext = AppContext.create()

  private func unowned<T: JavaScriptDecodable>(_ type: T.Type, from source: String) throws -> T {
    let runtime = try appContext.runtime
    let value = try runtime.eval(source)
    let buffer = JavaScriptValuesBuffer.copying(in: runtime, values: [value])
    return try T.decode(buffer.unownedValue(at: 0), in: runtime)
  }

  @Test
  func `decodes a record`() throws {
    #expect(try unowned(UnownedPoint.self, from: "({ x: 1, y: 2 })") == UnownedPoint(x: 1, y: 2))
    #expect(throws: (any Error).self) {
      _ = try unowned(UnownedPoint.self, from: "42")
    }
  }

  @Test
  func `decodes an array of records`() throws {
    #expect(try unowned([UnownedPoint].self, from: "[{ x: 1 }, { y: 2 }]") == [UnownedPoint(x: 1, y: 0), UnownedPoint(x: 0, y: 2)])
  }

  @Test
  func `decodes an enum through its raw value`() throws {
    #expect(try unowned(UnownedEnum.self, from: "'second'") == .second)
    #expect(throws: (any Error).self) {
      _ = try unowned(UnownedEnum.self, from: "'third'")
    }
  }
}

@Record
private struct UnownedPoint: Equatable {
  var x: Double = 0
  var y: Double = 0
}

private enum UnownedEnum: String, Enumerable {
  case first
  case second
}

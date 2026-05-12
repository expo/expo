// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation
import Testing

@testable import ExpoModulesCore

@Suite("DynamicDataType")
@JavaScriptActor
struct DynamicDataTypeTests {
  let appContext: AppContext

  init() {
    appContext = AppContext.create()
    appContext.moduleRegistry.register(holder: mockModuleHolder(appContext) {
      Name("DataTests")

      Function("readBytes") { (data: Data) -> [UInt8] in
        return Array(data)
      }
    })
  }

  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  @Test
  func `accepts full Uint8Array`() throws {
    let result = try runtime.eval([
      "typedArray = new Uint8Array([10, 20, 30])",
      "expo.modules.DataTests.readBytes(typedArray)"
    ]).asArray()

    #expect(try result.getValue(at: 0).asInt() == 10)
    #expect(try result.getValue(at: 1).asInt() == 20)
    #expect(try result.getValue(at: 2).asInt() == 30)
  }

  @Test
  func `accepts partial Uint8Array view with non-zero byteOffset`() throws {
    // byteOffset=1, length=3 → bytes [2, 3, 4] out of [1, 2, 3, 4, 5]
    let result = try runtime.eval([
      "buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer",
      "view = new Uint8Array(buffer, 1, 3)",
      "expo.modules.DataTests.readBytes(view)"
    ]).asArray()

    #expect(try result.getValue(at: 0).asInt() == 2)
    #expect(try result.getValue(at: 1).asInt() == 3)
    #expect(try result.getValue(at: 2).asInt() == 4)
  }

  @Test
  func `rejects non-typed-array value`() throws {
    #expect(throws: (any Error).self) {
      try runtime.eval("expo.modules.DataTests.readBytes([1, 2, 3])")
    }
  }
}

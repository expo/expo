// Copyright 2015-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("BlobConvertibles")
struct BlobConvertiblesTests {
  let appContext: AppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = AppContext.create()
    appContext.moduleRegistry.register(moduleType: BlobModule.self, name: nil)
  }

  @Test
  func `should support sync function`() throws {
    let isUint8Array = try runtime
      .eval([
        "result = expo.modules.BlobModule.echoSync(new Uint8Array([0x00, 0xff]))",
        "result instanceof Uint8Array"
      ])
      .asBool()
    #expect(isUint8Array == true)

    let array = try runtime.eval("Array.from(result)").asArray()
    #expect(array[0]?.getInt() == 0x00)
    #expect(array[1]?.getInt() == 0xff)
  }

  @Test
  func `should support sync function for dict`() throws {
    let isUint8Array = try runtime
      .eval([
        "result = expo.modules.BlobModule.echoMapSync({ key: new Uint8Array([0x00, 0xff]) })",
        "result.key instanceof Uint8Array"
      ])
      .asBool()
    #expect(isUint8Array == true)

    let array = try runtime.eval("Array.from(result.key)").asArray()
    #expect(array[0]?.getInt() == 0x00)
    #expect(array[1]?.getInt() == 0xff)
  }

  @Test
  func `should support async function`() async throws {
    try runtime
      .eval(
        "expo.modules.BlobModule.echoAsync(new Uint8Array([0x00, 0xff])).then((result) => { globalThis.result = result; })"
      )

    try await waitUntil(timeout: 2.0) {
      safeBoolEval("globalThis.result instanceof Uint8Array")
    }

    let array = try runtime.eval("Array.from(globalThis.result)").asArray()
    #expect(array[0]?.getInt() == 0x00)
    #expect(array[1]?.getInt() == 0xff)
  }

  @Test
  func `should support async function for dict`() async throws {
    try runtime
      .eval(
        "expo.modules.BlobModule.echoMapAsync({ key: new Uint8Array([0x00, 0xff]) }).then((result) => { globalThis.result = result; })"
      )

    try await waitUntil(timeout: 2.0) {
      safeBoolEval("globalThis.result != null && globalThis.result.key instanceof Uint8Array")
    }

    let array = try runtime.eval("Array.from(globalThis.result.key)").asArray()
    #expect(array[0]?.getInt() == 0x00)
    #expect(array[1]?.getInt() == 0xff)
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

private enum TestError: Error {
  case timeout
}

private class BlobModule: Module {
  public func definition() -> ModuleDefinition {
    Function("echoSync") { (data: Data) -> Data in
      #expect(data[0] == 0x00)
      #expect(data[1] == 0xff)
      return data
    }

    AsyncFunction("echoAsync") { (data: Data) -> Data in
      #expect(data[0] == 0x00)
      #expect(data[1] == 0xff)
      return data
    }

    Function("echoMapSync") { (map: [String: Data]) -> [String: Data] in
      #expect(map["key"]?[0] == 0x00)
      #expect(map["key"]?[1] == 0xff)
      return map
    }

    AsyncFunction("echoMapAsync") { (map: [String: Data]) -> [String: Data] in
      #expect(map["key"]?[0] == 0x00)
      #expect(map["key"]?[1] == 0xff)
      return map
    }
  }
}
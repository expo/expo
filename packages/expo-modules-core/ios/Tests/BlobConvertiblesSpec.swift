// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesCore

final class DataUint8ArrayConvertiblesSpec: ExpoSpec {
  override class func spec() {
    let appContext = AppContext.create()
    let runtime = try! appContext.runtime

    beforeSuite {
      appContext.moduleRegistry.register(moduleType: BlobModule.self)
    }

    it("should support sync function") {
      let isUint8Array = try runtime
        .eval([
          "result = expo.modules.BlobModule.echoSync(new Uint8Array([0x00, 0xff]))",
          "result instanceof Uint8Array"
        ])
        .asBool()
      expect(isUint8Array) == true

      let array = try runtime.eval("Array.from(result)").asArray()
      expect(array[0]?.getInt()) == 0x00
      expect(array[1]?.getInt()) == 0xff
    }

    it("should support sync function for dict") {
      let isUint8Array = try runtime
        .eval([
          "result = expo.modules.BlobModule.echoMapSync({ key: new Uint8Array([0x00, 0xff]) })",
          "result.key instanceof Uint8Array"
        ])
        .asBool()
      expect(isUint8Array) == true

      let array = try runtime.eval("Array.from(result.key)").asArray()
      expect(array[0]?.getInt()) == 0x00
      expect(array[1]?.getInt()) == 0xff
    }

    it("should support async function") {
      try runtime
        .eval(
          "expo.modules.BlobModule.echoAsync(new Uint8Array([0x00, 0xff])).then((result) => { globalThis.result = result; })"
        )
      expect(safeBoolEval("globalThis.result instanceof Uint8Array")).toEventually(beTrue(), timeout: .milliseconds(2000))
      let array = try runtime.eval("Array.from(globalThis.result)").asArray()
      expect(array[0]?.getInt()) == 0x00
      expect(array[1]?.getInt()) == 0xff
    }

    it("should support async function for dict") {
      try runtime
        .eval(
          "expo.modules.BlobModule.echoMapAsync({ key: new Uint8Array([0x00, 0xff]) }).then((result) => { globalThis.result = result; })"
        )
      expect(safeBoolEval("globalThis.result != null && globalThis.result.key instanceof Uint8Array")).toEventually(beTrue(), timeout: .milliseconds(2000))
      let array = try runtime.eval("Array.from(globalThis.result.key)").asArray()
      expect(array[0]?.getInt()) == 0x00
      expect(array[1]?.getInt()) == 0xff
    }

    // For async tests, this is a safe way to repeatedly evaluate JS
    // and catch both Swift and ObjC exceptions
    func safeBoolEval(_ js: String) -> Bool {
      var result = false
      do {
        try EXUtilities.catchException {
          guard let jsResult = try? runtime.eval(js) else {
            return
          }
          result = jsResult.getBool()
        }
      } catch {
        return false
      }
      return result
    }

  }
}

private class BlobModule: Module {
  public func definition() -> ModuleDefinition {
    Function("echoSync") { (data: Data) -> Data in
      expect(data[0]) == 0x00
      expect(data[1]) == 0xff
      return data
    }

    AsyncFunction("echoAsync") { (data: Data) -> Data in
      expect(data[0]) == 0x00
      expect(data[1]) == 0xff
      return data
    }

    Function("echoMapSync") { (map: [String: Data]) -> [String: Data] in
      expect(map["key"]?[0]) == 0x00
      expect(map["key"]?[1]) == 0xff
      return map
    }

    AsyncFunction("echoMapAsync") { (map: [String: Data]) -> [String: Data] in
      expect(map["key"]?[0]) == 0x00
      expect(map["key"]?[1]) == 0xff
      return map
    }
  }
}

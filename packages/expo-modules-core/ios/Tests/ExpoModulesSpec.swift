// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesCore

class ExpoModulesSpec: ExpoSpec {
  override func spec() {
    let appContext = AppContext.create()
    let interopBridge = SwiftInteropBridge(appContext: appContext)
    let runtime = appContext.runtime
    let testModuleName = "TestModule"
    let testFunctionName = "testFunction"
    let constantsDict: [String: Any] = [
      "expo": "is cool",
      "sdk": 45,
    ]

    beforeSuite {
      try! appContext.installExpoModulesHostObject(interopBridge)

      appContext.moduleRegistry.register(holder: mockModuleHolder(appContext) {
        Name(testModuleName)

        Constants(constantsDict)

        Function(testFunctionName) { Double.pi }
      })
    }

    describe("host object") {
      it("is defined") {
        expect(try! runtime?.eval("'ExpoModules' in this").asBool()) === true
      }

      it("has native module defined") {
        expect(try! runtime?.eval("'\(testModuleName)' in ExpoModules").asBool()) === true
      }

      it("can access native module") {
        let nativeModule = try! runtime?.eval("ExpoModules.\(testModuleName)")
        expect(nativeModule?.isUndefined()) == false
        expect(nativeModule?.isObject()) == true
        expect(nativeModule?.getRaw()).notTo(beNil())
      }

      it("has keys for registered modules") {
        let registeredModuleNames = appContext.moduleRegistry.getModuleNames()
        let keys = try! runtime?.eval("Object.keys(ExpoModules)").asArray().compactMap {
          return try! $0?.asString()
        }
        expect(keys).to(contain(registeredModuleNames))
      }
    }

    describe("module") {
      it("exposes constants") {
        let dict = try! runtime!.eval("ExpoModules.TestModule").asDict()

        dict.forEach { (key: String, value: Any) in
          expect(value) === dict[key]!
        }
      }

      it("has function") {
        expect(try! runtime?.eval("typeof ExpoModules.TestModule.\(testFunctionName)").asString()) == "function"
        expect(try! runtime?.eval("ExpoModules.TestModule.\(testFunctionName)").isFunction()) == true
      }

      it("calls function") {
        expect(try! runtime?.eval("ExpoModules.TestModule.\(testFunctionName)()").asDouble()) == Double.pi
      }
    }
  }
}

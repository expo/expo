// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesTestCore

@testable import ExpoModulesCore

class ExpoModulesSpec: ExpoSpec {
  override func spec() {
    let appContext = AppContext.create()
    let runtime = appContext.runtime
    let testModuleName = "TestModule"
    let testFunctionName = "testFunction"
    let throwingFunctionName = "throwingFunction"
    let exceptionToThrow = Exception(name: "Some exception", description: "Exception description")
    let constantsDict: [String: Any] = [
      "expo": "is cool",
      "sdk": 45,
    ]

    beforeSuite {
      appContext.moduleRegistry.register(holder: mockModuleHolder(appContext) {
        Name(testModuleName)

        Constants(constantsDict)

        Function(testFunctionName) { Double.pi }

        Function(throwingFunctionName) {
          throw exceptionToThrow
        }
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

      it("throws from sync function") {
        // Invoke the throwing function and return the error (eval shouldn't rethrow here)
        let error = try! runtime!.eval("try { ExpoModules.TestModule.\(throwingFunctionName)() } catch (error) { error }").asObject()

        // We just check if it contains the description — they won't be equal for the following reasons:
        // - the `exceptionToThrow` is just the root cause, in fact it returns `FunctionCallException`
        // - the debug description contains the file and line number, so it's hard to mock the `FunctionCallException`
        // Ideally if we have a better way (error codes/names) to identify them w/o relying on the description that may change over time.
        expect(error.getProperty("message").getString()).to(contain(exceptionToThrow.debugDescription))
      }
    }
  }
}

// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("ExpoModules")
struct ExpoModulesTests {
  let appContext: AppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  let testModuleName = "TestModule"
  let testFunctionName = "testFunction"
  let throwingFunctionName = "throwingFunction"
  let exceptionToThrow = Exception(name: "Some exception", description: "Exception description")
  let constantsDict: [String: Any] = [
    "expo": "is cool",
    "sdk": 45,
  ]

  init() {
    // Capture values to avoid escaping closure capturing `self`
    let moduleName = testModuleName
    let functionName = testFunctionName
    let throwingName = throwingFunctionName
    let constants = constantsDict
    let exception = exceptionToThrow

    appContext = AppContext.create()
    appContext.moduleRegistry.register(holder: mockModuleHolder(appContext) {
      Name(moduleName)

      Constants(constants)

      Function(functionName) { Double.pi }

      Function(throwingName) {
        throw exception
      }
    })
  }

  // MARK: - Host object

  @Test
  func `host object is defined`() throws {
    #expect(try runtime.eval("'expo' in this").asBool() == true)
    #expect(try runtime.eval("'modules' in expo").asBool() == true)
  }

  @Test
  func `has native module defined`() throws {
    #expect(try runtime.eval("'\(testModuleName)' in expo.modules").asBool() == true)
  }

  @Test
  func `can access native module`() throws {
    let nativeModule = try runtime.eval("expo.modules.\(testModuleName)")
    #expect(nativeModule.isUndefined() == false)
    #expect(nativeModule.isObject() == true)
    #expect(nativeModule.getRaw() != nil)
  }

  @Test
  func `has keys for registered modules`() throws {
    let registeredModuleNames = appContext.moduleRegistry.getModuleNames()
    let keys = try runtime.eval("Object.keys(expo.modules)").asArray().compactMap {
      return try! $0?.asString()
    }
    for moduleName in registeredModuleNames {
      #expect(keys.contains(moduleName))
    }
  }

  // MARK: - Module

  @Test
  func `exposes constants`() throws {
    let dict = try runtime.eval("expo.modules.TestModule").asDict()

    for (key, value) in dict {
      #expect(value as! NSObject === dict[key] as! NSObject)
    }
  }

  @Test
  func `has function`() throws {
    #expect(try runtime.eval("typeof expo.modules.TestModule.\(testFunctionName)").asString() == "function")
    #expect(try runtime.eval("expo.modules.TestModule.\(testFunctionName)").isFunction() == true)
  }

  @Test
  func `calls function`() throws {
    #expect(try runtime.eval("expo.modules.TestModule.\(testFunctionName)()").asDouble() == Double.pi)
  }

  @Test
  func `throws from sync function`() throws {
    // Invoke the throwing function and return the error (eval shouldn't rethrow here)
    let error = try runtime.eval("try { expo.modules.TestModule.\(throwingFunctionName)() } catch (error) { error }").asObject()

    // We just check if it contains the description — they won't be equal for the following reasons:
    // - the `exceptionToThrow` is just the root cause, in fact it returns `FunctionCallException`
    // - the debug description contains the file and line number, so it's hard to mock the `FunctionCallException`
    // Ideally if we have a better way (error codes/names) to identify them w/o relying on the description that may change over time.
    #expect(error.getProperty("message").getString().contains(exceptionToThrow.debugDescription))
  }
}

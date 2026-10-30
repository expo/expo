// Copyright 2026-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@SharedObject
private final class PackagedCounter: SharedObject {
  @JS
  init(value: Int) {}

  @JS
  func ping() -> String {
    return "pong"
  }
}

// Lists `PackagedCounter` in `classes:`, so the module and the package export the same class.
@ExpoModule(classes: [PackagedCounter.self])
private final class CounterModule: Module {}

@Suite("ExpoPackages")
@JavaScriptActor
struct ExpoPackagesTests {
  let appContext: AppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = AppContext.create()
    appContext.moduleRegistry.register(holder: mockModuleHolder(appContext, packageName: "expo-audio") {
      Name("AudioModule")
      Constants(["isAudioModule": true])
      Class("AudioPlayer") {}
      // Clashes with the module below, so it is not available in the package.
      Class("Audio") {}
    })
    appContext.moduleRegistry.register(holder: mockModuleHolder(appContext, packageName: "expo-audio") {
      Name("Audio")
    })
    appContext.moduleRegistry.register(package: ExpoPackage(sharedObjects: [PackagedCounter.self]), named: "expo-audio")
    appContext.moduleRegistry.register(holder: mockModuleHolder(appContext, packageName: ExpoPackage.localPackageName) {
      Name("LocalModule")
    })
    appContext.moduleRegistry.register(holder: mockModuleHolder(appContext) {
      Name("ModuleWithoutPackage")
    })
  }

  @Test
  func `package is defined`() throws {
    #expect(try runtime.eval("typeof expo.packages['expo-audio']").asString() == "object")
    #expect(try runtime.eval("typeof expo.packages.$local").asString() == "object")
    #expect(try runtime.eval("expo.packages['expo-video'] === undefined").asBool() == true)
  }

  @Test
  func `lists the package names`() throws {
    let names = try runtime.eval("Object.keys(expo.packages).join(',')").asString()
    #expect(names == "$local,expo-audio")
  }

  @Test
  func `modules object has only module names`() throws {
    #expect(try runtime.eval("expo.modules.AudioModule.isAudioModule").asBool() == true)
    #expect(try runtime.eval("expo.modules.ModuleWithoutPackage !== undefined").asBool() == true)
    #expect(try runtime.eval("expo.modules['expo-audio'] === undefined").asBool() == true)
  }

  @Test
  func `package returns the same object`() throws {
    #expect(try runtime.eval("expo.packages['expo-audio'] === expo.packages['expo-audio']").asBool() == true)
  }

  @Test
  func `package returns the module object`() throws {
    #expect(try runtime.eval("expo.packages['expo-audio'].AudioModule === expo.modules.AudioModule").asBool() == true)
    #expect(try runtime.eval("expo.packages.$local.LocalModule === expo.modules.LocalModule").asBool() == true)
  }

  @Test
  func `package returns the class from the module object`() throws {
    #expect(
      try runtime.eval("expo.packages['expo-audio'].AudioPlayer === expo.modules.AudioModule.AudioPlayer").asBool() == true
    )
  }

  @Test
  func `module takes precedence over class with the same name`() throws {
    #expect(try runtime.eval("expo.packages['expo-audio'].Audio === expo.modules.Audio").asBool() == true)
  }

  @Test
  func `package lists its modules and classes`() throws {
    let names = try runtime.eval("Object.keys(expo.packages['expo-audio']).join(',')").asString()
    #expect(names == "Audio,AudioModule,PackagedCounter,AudioPlayer")
  }

  @Test
  func `does not list modules from other packages`() throws {
    #expect(try runtime.eval("expo.packages['expo-audio'].LocalModule === undefined").asBool() == true)
    #expect(try runtime.eval("expo.packages['expo-audio'].ModuleWithoutPackage === undefined").asBool() == true)
  }

  @Test
  func `packages and package objects are read-only`() throws {
    #expect(throws: (any Error).self) {
      try runtime.eval("expo.packages['expo-audio'] = {}")
    }
    #expect(throws: (any Error).self) {
      try runtime.eval("expo.packages['expo-audio'].AudioPlayer = {}")
    }
  }

  @Test
  func `package returns its shared object class`() throws {
    #expect(try runtime.eval("typeof expo.packages['expo-audio'].PackagedCounter").asString() == "function")
    #expect(try runtime.eval("new expo.packages['expo-audio'].PackagedCounter(1).ping()").asString() == "pong")
  }

  @Test
  func `package returns the same shared object class`() throws {
    #expect(
      try runtime.eval("expo.packages['expo-audio'].PackagedCounter === expo.packages['expo-audio'].PackagedCounter")
        .asBool() == true
    )
  }

  @Test
  func `native instance gets the class of the package before JS reads the class`() throws {
    let encoded = try PackagedCounter.encode(PackagedCounter(value: 1), in: runtime)
    try runtime.global().setProperty("counter", value: encoded)
    #expect(try runtime.eval("counter.ping()").asString() == "pong")
    #expect(try runtime.eval("counter instanceof expo.packages['expo-audio'].PackagedCounter").asBool() == true)
  }

  @Test
  func `module classes and the package return the same class when the package is read first`() throws {
    appContext.moduleRegistry.register(module: CounterModule(appContext: appContext), name: nil)
    #expect(
      try runtime.eval("expo.packages['expo-audio'].PackagedCounter === expo.modules.CounterModule.PackagedCounter")
        .asBool() == true
    )
  }

  @Test
  func `module classes and the package return the same class when the module is read first`() throws {
    appContext.moduleRegistry.register(module: CounterModule(appContext: appContext), name: nil)
    #expect(
      try runtime.eval("expo.modules.CounterModule.PackagedCounter === expo.packages['expo-audio'].PackagedCounter")
        .asBool() == true
    )
  }
}

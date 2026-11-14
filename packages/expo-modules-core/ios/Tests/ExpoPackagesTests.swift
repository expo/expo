// Copyright 2026-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@SharedObject
private final class PackageCounter: SharedObject {
  @JS
  func ping() -> String {
    return "pong"
  }
}

@SharedObject("Player")
private final class PackagePlayer: SharedObject {
  @JS
  init(source: String) {}

  @JS
  func play() -> String {
    return "playing"
  }
}

@SharedObject("Audio")
private final class PackageNamedAudio: SharedObject {}

@ExpoModule(classes: [PackageCounter.self])
private final class PackageCounterModule: Module {
  @JS
  func greet() -> String {
    return "hi"
  }
}

@ExpoModule
private final class PackageOnlyModule: Module {}

private final class PackagesProviderMock: ModulesProvider {
  override var packages: [String: ExpoPackage] {
    return [
      "expo-counter": ExpoPackage(modules: [PackageCounterModule.self], sharedObjects: [PackageCounter.self]),
      "expo-package-only": ExpoPackage(modules: [PackageOnlyModule.self]),
      "expo-player": ExpoPackage(sharedObjects: [PackagePlayer.self]),
    ]
  }

  override func getModuleClasses() -> [ExpoModuleTupleType] {
    // Like the generated provider, lists a module of a package, but not all of them.
    return [(module: PackageCounterModule.self, name: nil)]
  }
}

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
    let moduleRegistry = appContext.moduleRegistry
    let packageRegistry = appContext.packageRegistry

    packageRegistry.register(holder: mockModuleHolder(appContext) {
      Name("AudioModule")
      Constants(["isAudioModule": true])
      // Classes on the module object aren't exports of the package.
      Class("AudioSession") {}
    }, inPackage: "expo-audio")
    // `Player` is exported, and `PackageNamedAudio` clashes with the module below, so it isn't.
    packageRegistry.register(sharedObjects: [PackagePlayer.self, PackageNamedAudio.self], inPackage: "expo-audio")
    packageRegistry.register(holder: mockModuleHolder(appContext) {
      Name("Audio")
    }, inPackage: "expo-audio")
    packageRegistry.register(holder: mockModuleHolder(appContext) {
      Name("LocalModule")
    }, inPackage: ExpoPackage.localPackageName)
    moduleRegistry.register(holder: mockModuleHolder(appContext) {
      Name("ModuleWithoutPackage")
    })
    // A module with the same name in another package and in `expo.modules`.
    packageRegistry.register(holder: mockModuleHolder(appContext) {
      Name("Audio")
      Constants(["isOtherAudio": true])
    }, inPackage: "other-audio")
    moduleRegistry.register(holder: mockModuleHolder(appContext) {
      Name("Audio")
      Constants(["isModulesAudio": true])
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
    #expect(names == "$local,expo-audio,other-audio")
  }

  @Test
  func `modules object does not have package modules`() throws {
    #expect(try runtime.eval("expo.modules.AudioModule === undefined").asBool() == true)
    #expect(try runtime.eval("expo.modules.LocalModule === undefined").asBool() == true)
    #expect(try runtime.eval("expo.modules.ModuleWithoutPackage !== undefined").asBool() == true)
    #expect(try runtime.eval("expo.modules['expo-audio'] === undefined").asBool() == true)
  }

  @Test
  func `packages and modules have independent namespaces`() throws {
    #expect(try runtime.eval("expo.modules.Audio.isModulesAudio").asBool() == true)
    #expect(try runtime.eval("expo.packages['other-audio'].Audio.isOtherAudio").asBool() == true)
    #expect(try runtime.eval("expo.packages['expo-audio'].Audio !== expo.modules.Audio").asBool() == true)
    #expect(
      try runtime.eval("expo.packages['expo-audio'].Audio !== expo.packages['other-audio'].Audio").asBool() == true
    )
  }

  @Test
  func `package returns the same object`() throws {
    #expect(try runtime.eval("expo.packages['expo-audio'] === expo.packages['expo-audio']").asBool() == true)
    #expect(
      try runtime.eval("expo.packages['expo-audio'].AudioModule === expo.packages['expo-audio'].AudioModule").asBool()
        == true
    )
  }

  @Test
  func `package returns the module object`() throws {
    #expect(try runtime.eval("expo.packages['expo-audio'].AudioModule.isAudioModule").asBool() == true)
  }

  @Test
  func `package returns the shared object class`() throws {
    #expect(try runtime.eval("typeof expo.packages['expo-audio'].Player").asString() == "function")
    #expect(try runtime.eval("expo.packages['expo-audio'].Player === expo.packages['expo-audio'].Player").asBool() == true)
    #expect(try runtime.eval("new expo.packages['expo-audio'].Player('song').play()").asString() == "playing")
    #expect(
      try runtime.eval("new expo.packages['expo-audio'].Player('song') instanceof expo.SharedObject").asBool() == true
    )
  }

  @Test
  func `module classes are not package exports`() throws {
    #expect(try runtime.eval("expo.packages['expo-audio'].AudioSession === undefined").asBool() == true)
    #expect(try runtime.eval("typeof expo.packages['expo-audio'].AudioModule.AudioSession").asString() == "function")
  }

  @Test
  func `module takes precedence over class with the same name`() throws {
    #expect(try runtime.eval("typeof expo.packages['expo-audio'].Audio").asString() == "object")
  }

  @Test
  func `package lists its modules and classes`() throws {
    let names = try runtime.eval("Object.keys(expo.packages['expo-audio']).join(',')").asString()
    #expect(names == "Audio,AudioModule,Player")
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
      try runtime.eval("expo.packages['expo-audio'].Player = {}")
    }
  }
}

@Suite("ExpoPackages from a modules provider")
@JavaScriptActor
struct ExpoPackagesProviderTests {
  let appContext: AppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = AppContext.create()
    appContext.useModulesProvider(PackagesProviderMock())
  }

  @Test
  func `module in both namespaces has one instance`() throws {
    let holder = appContext.package(named: "expo-counter")?.moduleHolder(named: "PackageCounterModule")
    #expect(holder != nil)
    #expect(holder === appContext.moduleRegistry.get(moduleHolderForName: "PackageCounterModule"))
    #expect(
      try runtime.eval("expo.packages['expo-counter'].PackageCounterModule === expo.modules.PackageCounterModule")
        .asBool() == true
    )
  }

  @Test
  func `package-only module is not in the modules object`() throws {
    #expect(try runtime.eval("expo.modules.PackageOnlyModule === undefined").asBool() == true)
    #expect(try runtime.eval("typeof expo.packages['expo-package-only'].PackageOnlyModule").asString() == "object")
  }

  @Test
  func `app context iterates over each module once`() {
    let holders = appContext.allModuleHolders
    #expect(holders.filter { $0.module is PackageOnlyModule }.count == 1)
    #expect(holders.filter { $0.module is PackageCounterModule }.count == 1)
    #expect(!appContext.moduleRegistry.contains { $0.module is PackageOnlyModule })
  }

  @Test
  func `package and module share the class of one native type`() throws {
    #expect(
      try runtime.eval(
        "expo.packages['expo-counter'].PackageCounter === expo.modules.PackageCounterModule.PackageCounter"
      ).asBool() == true
    )
    let names = try runtime.eval("Object.keys(expo.packages['expo-counter']).join(',')").asString()
    #expect(names == "PackageCounterModule,PackageCounter")
  }

  @Test
  func `module functions work through the package`() throws {
    #expect(try runtime.eval("expo.packages['expo-counter'].PackageCounterModule.greet()").asString() == "hi")
  }

  @Test
  func `package can have only shared object classes`() throws {
    #expect(try runtime.eval("Object.keys(expo.packages['expo-player']).join(',')").asString() == "Player")
    #expect(try runtime.eval("new expo.packages['expo-player'].Player('song').play()").asString() == "playing")
  }
}

// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("CoreModule")
@JavaScriptActor
struct CoreModuleTests {
  let appContext = AppContext.create()
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  @Test
  func `is initialized`() {
    #expect(appContext.coreModule != nil)
  }

  @Test
  func `core object is installed to global scope`() throws {
    let coreObjectValue = try runtime.eval("expo")
    #expect(coreObjectValue.kind == .object)
  }

  @Test
  func `installOnUIRuntime is a function on the core object`() throws {
    #expect(try runtime.eval("typeof expo.installOnUIRuntime").asString() == "function")
  }

  @Test
  func `installOnUIRuntime throws for a holder that is not an object`() throws {
    #expect(throws: (any Error).self) {
      _ = try runtime.eval("expo.installOnUIRuntime(1)")
    }
  }

  @Test
  func `expoModulesCoreVersion describes the package version`() throws {
    let version = CoreModuleHelper.getVersion()
    let components = version.split(separator: "-")[0].split(separator: ".").compactMap { Int($0) }
    #expect(try runtime.eval("expo.expoModulesCoreVersion.version").asString() == version)
    #expect(try runtime.eval("expo.expoModulesCoreVersion.major").asInt() == components[0])
    #expect(try runtime.eval("expo.expoModulesCoreVersion.minor").asInt() == components[1])
    #expect(try runtime.eval("expo.expoModulesCoreVersion.patch").asInt() == components[2])
  }

  @Test
  func `cacheDir is the path to the caches directory`() throws {
    let path = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first?.path
    #expect(try runtime.eval("expo.cacheDir").asString() == path)
  }

  @Test
  func `documentsDir is the path to the documents directory`() throws {
    let path = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first?.path
    #expect(try runtime.eval("expo.documentsDir").asString() == path)
  }

  @Test
  func `isRunningOnQuest is false`() throws {
    #expect(try runtime.eval("expo.isRunningOnQuest").asBool() == false)
  }

  @Test
  func `uuidv4 returns a random lowercase UUID v4`() throws {
    let uuid = try runtime.eval("expo.uuidv4()").asString()
    #expect(uuid.wholeMatch(of: #/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/#) != nil)
    #expect(try runtime.eval("expo.uuidv4()").asString() != uuid)
  }

  @Test
  func `uuidv5 returns the UUID v5 of the name in the namespace`() throws {
    let uuid = try runtime.eval("expo.uuidv5('www.example.com', '6ba7b810-9dad-11d1-80b4-00c04fd430c8')").asString()
    #expect(uuid == "2ed6657d-e927-568b-95e1-2665a8aea6a2")
  }

  @Test
  func `uuidv5 throws for a namespace that is not a UUID`() throws {
    let error = try #require(throws: ScriptEvaluationError.self) {
      _ = try runtime.eval("expo.uuidv5('www.example.com', 'not-a-uuid')")
    }
    #expect(error.message.contains("`not-a-uuid` is not a valid namespace"))
  }
}

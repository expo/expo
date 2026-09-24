// Copyright 2026-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

private let fabricFallbackModuleName = "FabricFallbackTestModule"

private final class FabricFallbackTestModule: Module {
  func definition() -> ModuleDefinition {
    Name(fabricFallbackModuleName)
  }
}

@Suite("ExpoFabricView", .serialized)
@JavaScriptActor
struct ExpoFabricViewTests {
  private func makeAppContextWithModule() -> AppContext {
    let appContext = AppContext()
    appContext.moduleRegistry.register(moduleType: FabricFallbackTestModule.self, name: nil)
    ExpoFabricView.appContextDidRegisterModules(appContext)
    return appContext
  }

  @Test
  func `resolves the given app context when it has the module`() throws {
    let appContext = makeAppContextWithModule()
    let newerAppContext = makeAppContextWithModule()

    let resolved = try #require(ExpoFabricView.resolveModuleHolder(appContext, moduleName: fabricFallbackModuleName))

    #expect(resolved.0 === appContext)
    withExtendedLifetime(newerAppContext) {}
  }

  @Test
  func `falls back to the newest app context when the given one is gone`() throws {
    _ = makeAppContextWithModule()
    let newestAppContext = makeAppContextWithModule()

    let resolved = try #require(ExpoFabricView.resolveModuleHolder(nil, moduleName: fabricFallbackModuleName))

    #expect(resolved.0 === newestAppContext)
    #expect(resolved.1.name == fabricFallbackModuleName)
  }

  @Test
  func `skips deallocated app contexts`() throws {
    let olderAppContext = makeAppContextWithModule()
    autoreleasepool {
      _ = makeAppContextWithModule()
    }

    let resolved = try #require(ExpoFabricView.resolveModuleHolder(nil, moduleName: fabricFallbackModuleName))

    #expect(resolved.0 === olderAppContext)
  }

  @Test
  func `returns nil when no live app context has the module`() {
    let resolved = ExpoFabricView.resolveModuleHolder(nil, moduleName: "ModuleThatNobodyRegistered")

    #expect(resolved?.0 == nil)
  }
}

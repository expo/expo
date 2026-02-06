// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("ModuleRegistry")
struct ModuleRegistryTests {
  let appContext = AppContext()

  @Test
  func `registers unnamed module`() {
    testRegister(moduleType: UnnamedModule.self, name: String(describing: UnnamedModule.self))
  }

  @Test
  func `registers named module`() {
    testRegister(moduleType: NamedModule.self, name: NamedModule.namedModuleName)
  }

  @Test
  func `does not override when preventModuleOverriding has previously been specified`() {
    // two modules with the same name
    class TestModule: Module {
      func definition() -> ModuleDefinition {
        Name("TestModule")
      }
    }
    class TestModule2: Module {
      func definition() -> ModuleDefinition {
        Name("TestModule")
      }
    }

    let moduleRegistry = appContext.moduleRegistry
    moduleRegistry.register(moduleType: TestModule.self, name: "TestModule", preventModuleOverriding: true)
    moduleRegistry.register(moduleType: TestModule2.self, name: "TestModule")

    #expect(moduleRegistry.has(moduleWithName: "TestModule") == true)
    #expect(moduleRegistry.get(moduleWithName: "TestModule") is TestModule)
  }

  private func testRegister<ModuleType: AnyModule>(moduleType: ModuleType.Type, name: String) {
    let moduleRegistry = appContext.moduleRegistry

    moduleRegistry.register(moduleType: moduleType, name: name)

    #expect(moduleRegistry.has(moduleWithName: name) == true)
  }
}

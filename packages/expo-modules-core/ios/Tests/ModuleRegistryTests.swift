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

  @Test
  func `concurrent registrations are thread safe`() async {
    let iterations = 1000
    let initialModulesCount = appContext.moduleRegistry.getModuleNames().count

    await withTaskGroup(of: Void.self) { group in
      for i in 0..<iterations {
        group.addTask {
          appContext.moduleRegistry.register(moduleType: UnnamedModule.self, name: "Module\(i)")
        }
      }
    }

    #expect(appContext.moduleRegistry.getModuleNames().count == initialModulesCount + iterations)
  }

  @Test
  func `concurrent reads and writes are thread safe`() async {
    let iterations = 1000
    let initialModulesCount = appContext.moduleRegistry.getModuleNames().count

    await withTaskGroup(of: Void.self) { group in
      for i in 0..<iterations {
        group.addTask {
          appContext.moduleRegistry.register(moduleType: UnnamedModule.self, name: "Module\(i)")
        }
        group.addTask {
          _ = appContext.moduleRegistry.has(moduleWithName: "Module\(i)")
        }
        group.addTask {
          _ = appContext.moduleRegistry.get(moduleWithName: "Module\(i)")
        }
      }
    }

    #expect(appContext.moduleRegistry.getModuleNames().count == initialModulesCount + iterations)
  }

  @Test
  func `concurrent unregistrations are thread safe`() async {
    let iterations = 1000
    let initialModulesCount = appContext.moduleRegistry.getModuleNames().count

    for i in 0..<iterations {
      appContext.moduleRegistry.register(moduleType: UnnamedModule.self, name: "Module\(i)")
    }

    await withTaskGroup(of: Void.self) { group in
      for i in 0..<iterations {
        group.addTask {
          appContext.moduleRegistry.unregister(moduleName: "Module\(i)")
        }
      }
    }

    #expect(appContext.moduleRegistry.getModuleNames().count == initialModulesCount)
  }

  private func testRegister<ModuleType: AnyModule>(moduleType: ModuleType.Type, name: String) {
    let moduleRegistry = appContext.moduleRegistry

    moduleRegistry.register(moduleType: moduleType, name: name)

    #expect(moduleRegistry.has(moduleWithName: name) == true)
  }
}

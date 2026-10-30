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
  func `registers modules from provider packages with their package names`() {
    class TestProvider: ModulesProvider {
      override var packages: [String: ExpoPackage] {
        return [
          "expo-test": ExpoPackage(modules: [UnnamedModule.self]),
          "expo-named": ExpoPackage(modules: [NamedModule.self], moduleNames: [ObjectIdentifier(NamedModule.self): "Renamed"]),
        ]
      }
    }

    let moduleRegistry = appContext.moduleRegistry
    moduleRegistry.register(fromProvider: TestProvider())

    let unnamedHolder = moduleRegistry.get(moduleHolderForName: String(describing: UnnamedModule.self))
    let renamedHolder = moduleRegistry.get(moduleHolderForName: "Renamed")
    #expect(unnamedHolder?.packageName == "expo-test")
    #expect(renamedHolder?.packageName == "expo-named")
    #expect(Set(moduleRegistry.packageNames) == ["expo-test", "expo-named"])
  }

  @Test
  func `lists the local package first and the other packages sorted`() {
    class LocalModule: Module {
      func definition() -> ModuleDefinition {
        Name("LocalModule")
      }
    }
    class TestProvider: ModulesProvider {
      override var packages: [String: ExpoPackage] {
        return [
          "expo-test": ExpoPackage(modules: [UnnamedModule.self]),
          ExpoPackage.localPackageName: ExpoPackage(modules: [LocalModule.self]),
          "@expo/named": ExpoPackage(modules: [NamedModule.self]),
        ]
      }
    }

    let moduleRegistry = appContext.moduleRegistry
    moduleRegistry.register(fromProvider: TestProvider())

    #expect(moduleRegistry.packageNames == ["$local", "@expo/named", "expo-test"])
  }

  @Test
  func `registers modules from getModuleClasses when the provider has no packages`() {
    class TestProvider: ModulesProvider {
      override func getModuleClasses() -> [ExpoModuleTupleType] {
        return [(module: UnnamedModule.self, name: nil)]
      }
    }

    let moduleRegistry = appContext.moduleRegistry
    moduleRegistry.register(fromProvider: TestProvider())

    let holder = moduleRegistry.get(moduleHolderForName: String(describing: UnnamedModule.self))
    #expect(holder != nil)
    #expect(holder?.packageName == nil)
  }

  @Test
  func `registers packages in the order of their names`() {
    class FirstModule: Module {
      func definition() -> ModuleDefinition {
        Name("SameName")
      }
    }
    class SecondModule: Module {
      func definition() -> ModuleDefinition {
        Name("SameName")
      }
    }
    class TestProvider: ModulesProvider {
      override var packages: [String: ExpoPackage] {
        return [
          "b-package": ExpoPackage(modules: [SecondModule.self]),
          "a-package": ExpoPackage(modules: [FirstModule.self]),
        ]
      }
    }

    let moduleRegistry = appContext.moduleRegistry
    moduleRegistry.register(fromProvider: TestProvider())

    // The package registered last wins, and that is always the one with the greater name.
    #expect(moduleRegistry.get(moduleWithName: "SameName") is SecondModule)
  }

  @Test
  func `registers the local package last, so its modules win`() {
    class PackageModule: Module {
      func definition() -> ModuleDefinition {
        Name("SameName")
      }
    }
    class LocalModule: Module {
      func definition() -> ModuleDefinition {
        Name("SameName")
      }
    }
    class TestProvider: ModulesProvider {
      override var packages: [String: ExpoPackage] {
        return [
          ExpoPackage.localPackageName: ExpoPackage(modules: [LocalModule.self]),
          "z-package": ExpoPackage(modules: [PackageModule.self]),
        ]
      }
    }

    let moduleRegistry = appContext.moduleRegistry
    moduleRegistry.register(fromProvider: TestProvider())

    #expect(moduleRegistry.get(moduleWithName: "SameName") is LocalModule)
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

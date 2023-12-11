import ExpoModulesTestCore

@testable import ExpoModulesCore

class ModuleRegistrySpec: ExpoSpec {
  override class func spec() {
    let appContext = AppContext()

    it("registers unnamed module") {
      testRegister(moduleType: UnnamedModule.self, name: String(describing: UnnamedModule.self))
    }

    it("registers named module") {
      testRegister(moduleType: NamedModule.self, name: NamedModule.namedModuleName)
    }

    it("does not override when preventModuleOverriding has previously been specified") {
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
      moduleRegistry.register(moduleType: TestModule.self, preventModuleOverriding: true)
      moduleRegistry.register(moduleType: TestModule2.self)

      expect(moduleRegistry.has(moduleWithName: "TestModule")).to(beTrue())
      expect(moduleRegistry.get(moduleWithName: "TestModule")).to(beAnInstanceOf(TestModule.self))
    }

    func testRegister<ModuleType: AnyModule>(moduleType: ModuleType.Type, name: String) {
      let moduleRegistry = appContext.moduleRegistry

      moduleRegistry.register(moduleType: moduleType)

      expect(moduleRegistry.has(moduleWithName: name)).to(beTrue())
    }
  }
}

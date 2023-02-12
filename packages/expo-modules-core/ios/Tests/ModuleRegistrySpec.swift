import ExpoModulesTestCore

@testable import ExpoModulesCore

class ModuleRegistrySpec: ExpoSpec {
  override func spec() {
    let appContext = AppContext()

    it("registers unnamed module") {
      testRegister(moduleType: UnnamedModule.self, name: String(describing: UnnamedModule.self))
    }

    it("registers named module") {
      testRegister(moduleType: NamedModule.self, name: NamedModule.namedModuleName)
    }

    func testRegister<ModuleType: AnyModule>(moduleType: ModuleType.Type, name: String) {
      let moduleRegistry = appContext.moduleRegistry

      moduleRegistry.register(moduleType: moduleType)

      expect(moduleRegistry.has(moduleWithName: name)).to(beTrue())
    }
  }
}

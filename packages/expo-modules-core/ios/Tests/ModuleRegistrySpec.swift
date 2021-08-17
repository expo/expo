import Quick
import Nimble

@testable import ExpoModulesCore

class ModuleRegistrySpec: QuickSpec {
  override func spec() {
    let appContext = AppContext()

    it("registers unnamed module") {
      testRegister(module: UnnamedModule(appContext: appContext), name: String(describing: UnnamedModule.self))
    }

    it("registers named module") {
      testRegister(module: NamedModule(appContext: appContext), name: NamedModule.namedModuleName)
    }

    func testRegister(module: Module, name: String) {
      let moduleRegistry = appContext.moduleRegistry

      moduleRegistry.register(module: module)

      expect(moduleRegistry.has(moduleWithName: name)).to(beTrue())
      expect(moduleRegistry.get(moduleWithName: name)).to(beIdenticalTo(module))
      expect(moduleRegistry.contains { $0.module === module }).to(beTrue())
      expect(moduleRegistry.get(moduleHolderForName: name)?.module).to(beIdenticalTo(module))
    }
  }
}

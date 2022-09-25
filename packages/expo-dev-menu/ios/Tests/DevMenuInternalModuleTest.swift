import Quick
import Nimble

@testable import EXDevMenu

class DevMenuInternalModuleTest: QuickSpec {
  override func spec() {
    it("constants should contain information about key command support") {
      #if targetEnvironment(simulator)
          let doesDeviceSupportKeyCommands = true
      #else
          let doesDeviceSupportKeyCommands = false
      #endif
      let module = DevMenuInternalModule(manager: DevMenuManager.shared)

      let constants = module.constantsToExport()

      expect(constants["doesDeviceSupportKeyCommands"] as? Bool).to(equal(doesDeviceSupportKeyCommands))
    }
  }
}

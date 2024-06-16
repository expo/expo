import ExpoModulesTestCore

@testable import ExpoModulesCore
@testable import EXDevMenu

class DevMenuInternalModuleTest: ExpoSpec {
  override class func spec() {
    let appContext = AppContext.create()
    let module = DevMenuInternalModule(appContext: appContext)

    it("constants should contain information about key command support") {
      #if targetEnvironment(simulator)
          let doesDeviceSupportKeyCommands = true
      #else
          let doesDeviceSupportKeyCommands = false
      #endif
      let constants = module.definition().getConstants()

      expect(constants["doesDeviceSupportKeyCommands"] as? Bool).to(equal(doesDeviceSupportKeyCommands))
    }
  }
}

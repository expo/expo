import Quick
import Nimble

@testable import EXDevMenu
@testable import EXDevMenuInterface

class DevMenuExtensionsTest: QuickSpec {
  class MockedSettings: DevMenuExtensionSettingsProtocol {
    func wasRunOnDevelopmentBridge() -> Bool {
      return true
    }
  }

  override func spec() {
    it("getAllItems should return nil when called without the bridge") {
      let settings = MockedSettings()
      let module = DevMenuExtensions()

      let itemContainer = module.devMenuItems(settings)

      expect(itemContainer).to(beNil())
    }

    it("getAllItems should return nil when called without DevSettings") {
      let settings = MockedSettings()
      let module = DevMenuExtensions()
      module.bridge = MockedNOOPBridge(delegate: nil, launchOptions: nil)

      let itemContainer = module.devMenuItems(settings)

      expect(itemContainer).to(beNil())
    }
  }
}

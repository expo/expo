import Quick
import Nimble

@testable import EXDevMenu

class DevMenuRCTBridgeTest: QuickSpec {
  @objc(RCTAllowModule)
  class RCTAllowModule: NSObject {}
  @objc(NotAllowModule)
  class NotAllowModule: NSObject {}

  override class func spec() {
    it("should be connected with DevMenuRCTCxxBridge") {
      let bridge = DevMenuRCTBridge(delegate: nil, launchOptions: nil)!

      expect(bridge.bridgeClass()).to(be(DevMenuRCTCxxBridge.self))
    }

    it("should be able to filter non essential modules") {
      let cxxBridge = DevMenuRCTBridge(delegate: nil, launchOptions: nil)!.batched as! DevMenuRCTCxxBridge

      let filteredModules = cxxBridge.filterModuleList([RCTAllowModule.self, NotAllowModule.self])

      expect(filteredModules.count).to(equal(1))
      expect(filteredModules.first).to(be(RCTAllowModule.self))
    }
  }
}

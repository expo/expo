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
      let bridgeDelegate = MockBridgeDelegate()
      let bridge = DevMenuRCTBridge(delegate: bridgeDelegate, launchOptions: nil)!
      waitBridgeReady(bridgeDelegate: bridgeDelegate)

      expect(bridge.bridgeClass()).to(be(DevMenuRCTCxxBridge.self))
    }

    it("should be able to filter non essential modules") {
      let bridgeDelegate = MockBridgeDelegate()
      let cxxBridge = DevMenuRCTBridge(delegate: bridgeDelegate, launchOptions: nil)!.batched as! DevMenuRCTCxxBridge
      waitBridgeReady(bridgeDelegate: bridgeDelegate)

      let filteredModules = cxxBridge.filterModuleList([RCTAllowModule.self, NotAllowModule.self])

      expect(filteredModules.count).to(equal(1))
      expect(filteredModules.first).to(be(RCTAllowModule.self))
    }
  }
}

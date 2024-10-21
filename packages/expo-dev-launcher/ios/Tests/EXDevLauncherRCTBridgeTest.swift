import Quick
import Nimble

@testable import EXDevLauncher
@testable import EXDevMenu

class EXDevLauncherRCTBridgeTest: QuickSpec {
  @objc(RCTAllowModule)
  class RCTAllowModule: NSObject {}
  @objc(NotAllowModule)
  class NotAllowModule: NSObject {}
  @objc(ExpoBridgeModuleAbc)
  class ExpoBridgeModuleAbc: NSObject {}

  override class func spec() {
    it("should be connected with EXDevLauncherRCTCxxBridge") {
      let bridgeDelegate = MockBridgeDelegate()
      let bridge = EXDevLauncherRCTBridge(delegate: bridgeDelegate, launchOptions: nil)!
      waitBridgeReady(bridgeDelegate: bridgeDelegate)

      expect(bridge.bridgeClass()).to(be(EXDevLauncherRCTCxxBridge.self))
    }

    it("should be able to filter non essential modules") {
      let bridgeDelegate = MockBridgeDelegate()
      let cxxBridge = EXDevLauncherRCTBridge(delegate: bridgeDelegate, launchOptions: nil)!.batched as! EXDevLauncherRCTCxxBridge
      waitBridgeReady(bridgeDelegate: bridgeDelegate)

      let filteredModules = cxxBridge.filterModuleList([RCTAllowModule.self, NotAllowModule.self, ExpoBridgeModuleAbc.self])

      expect(filteredModules.count).to(equal(2))
      expect(filteredModules[0]).to(be(RCTAllowModule.self))
      expect(filteredModules[1]).to(be(ExpoBridgeModuleAbc.self))
    }
  }
}

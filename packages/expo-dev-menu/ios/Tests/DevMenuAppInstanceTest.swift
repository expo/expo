import Quick
import Nimble

@testable import EXDevMenu

class DevMenuAppInstanceTest: QuickSpec {
  class MockedBridge: RCTBridge {
    var enqueueJSCallWasCalled = false

    override func invalidate() {
      // NOOP
    }

    override func enqueueJSCall(_ moduleDotMethod: String!, args: [Any]!) {
      enqueueJSCallWasCalled = true

      expect(moduleDotMethod).to(equal("RCTDeviceEventEmitter.emit"))
      expect(args.first as? String).to(equal("closeDevMenu"))
    }
  }

  override class func spec() {
    it("checks if `sendCloseEvent` sends correct event") {
      let mockedBridge = MockedBridge(delegate: nil, launchOptions: nil)!
      let appInstance = DevMenuAppInstance(
        manager: DevMenuManager.shared,
        bridge: mockedBridge
      )

      appInstance.sendCloseEvent()

      expect(mockedBridge.enqueueJSCallWasCalled).to(beTrue())
    }

    it("checks if js bundle was found") {
      let mockedBridge = MockedBridge(delegate: nil, launchOptions: nil)!
      let appInstance = DevMenuAppInstance(
        manager: DevMenuManager.shared,
        bridge: mockedBridge
      )

      let sourceURL = appInstance.sourceURL(for: mockedBridge)

      expect(sourceURL).toNot(beNil())
    }

    it("checks if extra modules was exported") {
      let mockedBridge = MockedBridge(delegate: nil, launchOptions: nil)!
      let appInstance = DevMenuAppInstance(
        manager: DevMenuManager.shared,
        bridge: mockedBridge
      )

        let extraModules = appInstance.extraModules(for: mockedBridge)

      expect(extraModules).toNot(beNil())
      expect(extraModules?.first { type(of: $0).moduleName() == "DevLoadingView" }).toNot(beNil())
      expect(extraModules?.first { type(of: $0).moduleName() == "DevSettings" }).toNot(beNil())
    }
  }
}

import Quick
import Nimble

@testable import EXDevLauncher
@testable import EXDevMenuInterface

class EXDevLauncherMenuDelegateTest: QuickSpec {
  class MockedApiClient: DevMenuExpoApiClientProtocol {
    func isLoggedIn() -> Bool {
      return false
    }

    func setSessionSecret(_ sessionSecret: String?) {}

    func queryDevSessionsAsync(_ installationID: String?, completionHandler: @escaping HTTPCompletionHandler) {}

    func queryUpdateChannels(appId: String, completionHandler: @escaping ([DevMenuEASUpdates.Channel]?, URLResponse?, Error?) -> Void, options: DevMenuGraphQLOptions) {}

    func queryUpdateBranches(appId: String, completionHandler: @escaping ([DevMenuEASUpdates.Branch]?, URLResponse?, Error?) -> Void, branchesOptions: DevMenuGraphQLOptions, updatesOptions: DevMenuGraphQLOptions) {}
  }

  class MockedMenu: DevMenuManagerProtocol {
    var isVisible: Bool = false

    weak var delegate: DevMenuDelegateProtocol?

    func openMenu(_ screen: String?) -> Bool {
      return true
    }

    func openMenu() -> Bool {
      return true
    }

    func closeMenu() -> Bool {
      return true
    }

    func hideMenu() -> Bool {
      return true
    }

    func toggleMenu() -> Bool {
      return true
    }

    var expoApiClient: DevMenuExpoApiClientProtocol = MockedApiClient()
  }

  override func spec() {
    it("LauncherDelegate should serialize to the correct scheme") {
      let delegate = LauncherDelegate(withController: EXDevLauncherController.sharedInstance())

      let appInfo = delegate.appInfo(forDevMenuManager: MockedMenu())!

      expect(appInfo["appName"] as? String).to(equal("Development Client"))
      expect(appInfo["appVersion"] as? String).to(equal(EXDevLauncherController.version()))
      expect(appInfo["appIcon"]).to(be(NSNull()))
      expect(appInfo["hostUrl"]).to(be(NSNull()))
    }

    it("LauncherDelegate shouldn't support developement tools") {
      let delegate = LauncherDelegate(withController: EXDevLauncherController.sharedInstance())

      let supportsDevelopment = delegate.supportsDevelopment()

      expect(supportsDevelopment).to(beFalse())
    }

    it("AppDelegate should serialize to the correct scheme") {
      let delegate = AppDelegate(withController: EXDevLauncherController.sharedInstance())

      let appInfo = delegate.appInfo(forDevMenuManager: MockedMenu())!

      expect(appInfo["appName"] as? String).to(equal("Development Client - App"))
      expect(appInfo["appVersion"]).to(be(NSNull()))
      expect(appInfo["appIcon"]).to(be(NSNull()))
      expect(appInfo["hostUrl"]).to(be(NSNull()))
    }

    it("AppDelegate should support development tools") {
      let delegate = AppDelegate(withController: EXDevLauncherController.sharedInstance())

      let supportsDevelopment = delegate.supportsDevelopment()

      expect(supportsDevelopment).to(beTrue())
    }
  }
}

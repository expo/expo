import Quick
import Nimble
import React

@testable import EXDevLauncher

class EXDevLauncherControllerTest: QuickSpec {
  override class func spec() {
    it("should return correct version") {
      let version = EXDevLauncherController.version()

      expect(version).toNot(beNil())
    }

    it("sharedInstance should always return the same instance") {
      let sharedInstance = EXDevLauncherController.sharedInstance()

      expect(sharedInstance).toNot(beNil())
      expect(sharedInstance).to(be(EXDevLauncherController.sharedInstance()))
    }

    it("controller should have access to managers classes") {
      let module = EXDevLauncherController.sharedInstance()

      expect(module.errorManager()).toNot(beNil())
      expect(module.pendingDeepLinkRegistry).toNot(beNil())
    }
  }
}

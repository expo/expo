import Quick
import Nimble

@testable import EXDevLauncher

class EXDevLauncherTest: QuickSpec {
  override class func spec() {
    it("exported constants should contain correct fields") {
      let module = EXDevLauncher()

      let exportedConstants = module.constantsToExport()!

      expect(exportedConstants["manifestString"]).toNot(beNil())
      expect(exportedConstants["manifestURL"]).toNot(beNil())
    }
  }
}

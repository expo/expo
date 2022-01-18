import Quick
import Nimble

@testable import EXDevMenu

class DevMenuManagerProviderTest: QuickSpec {
  override func spec() {
    it("provider should return correct instance of DevManager") {
      let provider = DevMenuManagerProvider()

      let providedManager = provider.getDevMenuManager()

      expect(providedManager).to(be(DevMenuManager.shared))
      expect(providedManager).to(be(provider.getDevMenuManager()))
    }
  }
}

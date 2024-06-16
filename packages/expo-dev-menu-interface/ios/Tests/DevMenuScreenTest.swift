import Quick
import Nimble

@testable import EXDevMenuInterface

class DevMenuScreenTest: QuickSpec {
  override class func spec() {
    it("Screen should be serializable") {
      let screen = DevMenuScreen("screen-1")

      let serilizedData = screen.serialize()

      expect(serilizedData["type"] as? Int).to(equal(ItemType.screen.rawValue))
      expect(serilizedData["screenName"] as? String).to(equal("screen-1"))
    }
  }
}

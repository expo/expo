import Quick
import Nimble

@testable import EXDevMenuInterface

class DevMenuSelectionListTest: QuickSpec {
  override class func spec() {
    it("List should be serializable") {
      let list = DevMenuSelectionList()

      let serilizedData = list.serialize()

      expect(serilizedData["type"] as? Int).to(equal(ItemType.selectionList.rawValue))
      expect(serilizedData["actionId"] as? String).toNot(beNil())
    }
  }
}

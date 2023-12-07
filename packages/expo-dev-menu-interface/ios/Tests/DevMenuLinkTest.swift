import Quick
import Nimble

@testable import EXDevMenuInterface

class DevMenuLinkTest: QuickSpec {
  override class func spec() {
    it("Link should be serializable") {
      let link = DevMenuLink(withTarget: "target-1")
      link.glyphName = { "link-1-glyph" }
      link.label = { "link-1-label" }

      let serilizedData = link.serialize()

      expect(serilizedData["type"] as? Int).to(equal(ItemType.link.rawValue))
      expect(serilizedData["label"] as? String).to(equal("link-1-label"))
      expect(serilizedData["glyphName"] as? String).to(equal("link-1-glyph"))
    }
  }
}

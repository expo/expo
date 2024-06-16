import Quick
import Nimble

@testable import EXDevMenuInterface

class DevMenuActionTest: QuickSpec {
  override class func spec() {
    it("Action should be serializable") {
      let action = DevMenuAction(withId: "action-1", {})
      action.isAvailable = { true }
      action.isEnabled = { true }
      action.label = { "action-1-label" }
      action.detail = { "action-1-details" }
      action.glyphName = { "action-1-glyphname" }
      action.registerKeyCommand(input: "r", modifiers: .command)

      let serilizedData = action.serialize()

      expect(serilizedData["type"] as? Int).to(equal(ItemType.action.rawValue))
      expect(serilizedData["actionId"] as? String).to(equal("action-1"))
      expect(serilizedData["isAvailable"] as? Bool).to(beTrue())
      expect(serilizedData["isEnabled"] as? Bool).to(beTrue())
      expect(serilizedData["label"] as? String).to(equal("action-1-label"))
      expect(serilizedData["detail"] as? String).to(equal("action-1-details"))
      expect(serilizedData["glyphName"] as? String).to(equal("action-1-glyphname"))

      let keyCommand = serilizedData["keyCommand"] as! [String: Any]

      expect(keyCommand["input"] as? String).to(equal("r"))
      expect(keyCommand["modifiers"] as? Int).to(equal(1 << 2))
    }

    it("Action callable should be contain passed action") {
      var wasCalled = false
      let action = DevMenuAction(withId: "action-1", { wasCalled = true })

      action.callable.call()

      expect(wasCalled).to(beTrue())
    }
  }
}

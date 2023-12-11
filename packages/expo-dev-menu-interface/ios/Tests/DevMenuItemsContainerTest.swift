import Quick
import Nimble

@testable import EXDevMenuInterface

class DevMenuItemsContainerTest: QuickSpec {
  override class func spec() {
    it("should respect importance") {
      let container = DevMenuItemsContainer()

      let seeder = [("action-1", ItemImportance.lowest), ("action-2", ItemImportance.medium), ("action-3", ItemImportance.highest)]

      seeder.forEach { actionDate in
        let action = DevMenuAction(withId: actionDate.0)
        action.label = { actionDate.0 }
        action.importance = actionDate.1.rawValue

        container.addItem(action)
      }
      let items = container.getRootItems()

      expect(items.count).to(equal(3))
      expect((items[0] as! DevMenuAction).label()).to(equal("action-3"))
      expect((items[1] as! DevMenuAction).label()).to(equal("action-2"))
      expect((items[2] as! DevMenuAction).label()).to(equal("action-1"))
    }

    it("should unwrap other containers") {
      let container = DevMenuItemsContainer()
      container.addItem(DevMenuAction(withId: "action-1"))
      let innerContainer = DevMenuGroup()
      innerContainer.addItem(DevMenuAction(withId: "action-2"))
      container.addItem(innerContainer)

      let items = container.getAllItems()

      expect(items.count).to(equal(3))
      expect(items[0] as? DevMenuAction).toNot(beNil())
      expect(items[1] as? DevMenuGroup).toNot(beNil())
      expect(items[2] as? DevMenuAction).toNot(beNil())
    }

    it("should serilize items") {
      let container = DevMenuItemsContainer()
      container.addItem(DevMenuAction(withId: "action-1"))
      let innerContainer = DevMenuGroup()
      innerContainer.addItem(DevMenuAction(withId: "action-2"))
      container.addItem(innerContainer)

      let items = container.serializeItems()

      expect(items.count).to(equal(2))
      expect(items[0]["type"] as? Int).to(equal(ItemType.action.rawValue))
      expect(items[0]["actionId"] as? String).to(equal("action-1"))

      expect(items[1]["type"] as? Int).to(equal(ItemType.group.rawValue))

      let innerItem = (items[1]["items"] as! [[String: Any]])[0]
      expect(innerItem["type"] as? Int).to(equal(ItemType.action.rawValue))
      expect(innerItem["actionId"] as? String).to(equal("action-2"))
    }
  }
}

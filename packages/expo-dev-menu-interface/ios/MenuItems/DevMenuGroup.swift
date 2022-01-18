// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
open class DevMenuGroup: DevMenuScreenItem, DevMenuItemsContainerProtocol {
  let container = DevMenuItemsContainer()

  @objc
  public init() {
    super.init(type: .Group)
  }

  @objc
  public func addItem(_ item: DevMenuScreenItem) {
    container.addItem(item)
  }

  public func getRootItems() -> [DevMenuScreenItem] {
    return container.getRootItems()
  }

  public func getAllItems() -> [DevMenuScreenItem] {
    return container.getAllItems()
  }

  public func serializeItems() -> [[String: Any]] {
    return container.serializeItems()
  }

  @objc
  public override func serialize() -> [String: Any] {
    var dict = super.serialize()
    dict["items"] = serializeItems()
    return dict
  }
}

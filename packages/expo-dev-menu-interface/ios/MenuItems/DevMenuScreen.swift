// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public class DevMenuScreen: DevMenuItem, DevMenuItemsContainerProtocol {
  let container = DevMenuItemsContainer()
  public private(set) var screenName: String

  public func getRootItems() -> [DevMenuScreenItem] {
    return container.getRootItems()
  }

  public func getAllItems() -> [DevMenuScreenItem] {
    return container.getAllItems()
  }

  public func addItem(_ item: DevMenuScreenItem) {
    container.addItem(item)
  }

  func serializeItems() -> [[String: Any]] {
    return container.serializeItems()
  }

  public init(_ screenName: String) {
    self.screenName = screenName
    super.init(type: .Screen)
  }

  public override func serialize() -> [String: Any] {
    var dict = super.serialize()
    dict["screenName"] = screenName
    dict["items"] = serializeItems()
    return dict
  }
}

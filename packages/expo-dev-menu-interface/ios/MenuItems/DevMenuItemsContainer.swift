// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public class DevMenuItemsContainer: NSObject, DevMenuItemsContainerProtocol {
  private var items: [DevMenuScreenItem] = []

  public func getRootItems() -> [DevMenuScreenItem] {
    return items.sorted { $0.importance > $1.importance }
  }

  public func getAllItems() -> [DevMenuScreenItem] {
    var result: [DevMenuScreenItem] = []
    for item in items {
      result.append(item)
      if let container = item as? DevMenuItemsContainerProtocol {
        result.append(contentsOf: container.getAllItems())
      }
    }
    return result.sorted { $0.importance > $1.importance }
  }

  @objc
  public func addItem(_ item: DevMenuScreenItem) {
    items.append(item)
  }

  func serializeItems() -> [[String: Any]] {
    return getRootItems().map({ $0.serialize() })
  }
}

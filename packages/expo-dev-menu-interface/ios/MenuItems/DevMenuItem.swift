// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
open class DevMenuItem: NSObject {
  @objc(DevMenuItemType)
  public enum ItemType: Int {
    case Action = 1
    case Group = 2
    case Screen = 3
    case Link = 4
    case SelectionList = 5
  }

  @objc
  public let type: ItemType

  init(type: ItemType) {
    self.type = type
  }

  @objc
  open func serialize() -> [String: Any] {
    return [
      "type": type.rawValue
    ]
  }
}

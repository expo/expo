// Copyright 2015-present 650 Industries. All rights reserved.

@objc
open class DevMenuItem: NSObject {
  @objc(DevMenuItemType)
  public enum ItemType: Int {
    case Action = 1
    case Group = 2
  }

  // Static members fit better than enum as we allow any other number.
  static public let ImportanceLowest = -200
  static public let ImportanceLow = -100
  static public let ImportanceMedium = 0
  static public let ImportanceHigh = 100
  static public let ImportanceHighest = 200

  // This enum is just for Objective-C compatibility, where values are automatically casted to integers.
  @objc(DevMenuItemImportance)
  public enum ItemImportance: Int {
    case Lowest = -200
    case Low = -100
    case Medium = 0
    case High = 100
    case Highest = 200
  }

  @objc
  public let type: ItemType

  @objc
  open var isAvailable: () -> Bool = { true }

  @objc
  open var isEnabled: () -> Bool = { false }

  @objc
  open var label: () -> String = { "" }

  @objc
  open var detail: () -> String = { "" }

  @objc
  open var glyphName: () -> String = { "" }

  @objc
  open var importance: Int = ItemImportance.Medium.rawValue

  init(type: ItemType) {
    self.type = type
  }

  @objc
  open func serialize() -> [String : Any] {
    return [
      "type": type.rawValue,
      "isAvailable": isAvailable(),
      "isEnabled": isEnabled(),
      "label": label(),
      "detail": detail(),
      "glyphName": glyphName()
    ]
  }
}

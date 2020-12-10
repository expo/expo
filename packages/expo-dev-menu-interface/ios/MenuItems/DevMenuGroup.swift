// Copyright 2015-present 650 Industries. All rights reserved.

@objc
open class DevMenuGroup: DevMenuItem {
  let groupName: String
  var items: [DevMenuItem] = []

  @objc
  public init(withName name: String?) {
    self.groupName = name ?? ""
    super.init(type: .Group)
  }

  @objc
  convenience public init() {
    self.init(withName: nil)
  }

  @objc
  open func addItem(_ item: DevMenuItem) {
    items.append(item)
  }

  @objc
  open override func serialize() -> [String : Any] {
    var dict = super.serialize()
    dict["groupName"] = groupName
    dict["items"] = items.map({ $0.serialize() })
    return dict
  }
}

// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public class DevMenuLink: DevMenuScreenItem {
  var target: String

  @objc
  open var label: () -> String = { "" }

  @objc
  open var glyphName: () -> String = { "" }

  public init(withTarget target: String) {
    self.target = target
    super.init(type: .Link)
  }

  @objc
  open override func serialize() -> [String: Any] {
    var dict = super.serialize()
    dict["target"] = target
    dict["label"] = label()
    dict["glyphName"] = glyphName()
    return dict
  }
}

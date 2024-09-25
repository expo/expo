// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal struct DomWebViewSource: Record {
  @Field
  var uri: String?
}

internal struct ContentInset: Record {
  @Field
  var top: Double? = 0

  @Field
  var left: Double? = 0

  @Field
  var bottom: Double? = 0

  @Field
  var right: Double? = 0

  func toEdgeInsets() -> UIEdgeInsets {
    var inset = UIEdgeInsets.zero
    inset.top = CGFloat(self.top ?? 0)
    inset.left = CGFloat(self.left ?? 0)
    inset.bottom = CGFloat(self.bottom ?? 0)
    inset.right = CGFloat(self.right ?? 0)
    return inset
  }
}

internal struct ScrollToParam: Record {
  @Field
  var x: Double = 0

  @Field
  var y: Double = 0

  @Field
  var animated: Bool = true
}

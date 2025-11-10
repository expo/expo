// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class RNHost: ExpoView, ExpoSwiftUI.RNHostProtocol {
  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }
  
  public var matchContents: Bool = false

  public override func layoutSubviews() {
    super.layoutSubviews()
    if matchContents {
      let subview = self.subviews.first
      if let subview {
        self.setViewSize(subview.bounds.size)
      }
    } else {
      self.setViewSize(bounds.size)
    }
  }
}

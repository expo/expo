// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class RNHostView: ExpoView {
  private var touchHandler: UIGestureRecognizer?

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    // Create and attach React Native's touch handler
    // This is necessary for views inside SwiftUI contexts (like sheets)
    touchHandler = RNHostViewTouchHelper.createTouchHandler(for: self)
    if let touchHandler = touchHandler {
      self.addGestureRecognizer(touchHandler)
    }
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    // set shadow node size
    self.setViewSize(bounds.size)
  }

  deinit {
    if let touchHandler = touchHandler {
      RNHostViewTouchHelper.detachTouchHandler(touchHandler, from: self)
    }
  }
}

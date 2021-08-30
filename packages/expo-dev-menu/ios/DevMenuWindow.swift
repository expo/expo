// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit

class DevMenuWindow: UIWindow {
  private let manager: DevMenuManager

  init(manager: DevMenuManager) {
    self.manager = manager

    super.init(frame: UIScreen.main.bounds)
    self.rootViewController = DevMenuViewController(manager: manager)
    self.backgroundColor = UIColor.clear
    self.bounds = UIScreen.main.bounds
    self.windowLevel = .statusBar
    self.isHidden = true
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func becomeKey() {
    (rootViewController as? DevMenuViewController)?.updateProps()
  }
}

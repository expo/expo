// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import EXDevMenuInterface

@objcMembers
public class DevLauncherDevMenuDelegate: NSObject, DevMenuHostDelegate {
  public weak var controller: EXDevLauncherController?

  public init(controller: EXDevLauncherController) {
    self.controller = controller
    super.init()
  }

  public func devMenuNavigateHome() {
    controller?.navigateToLauncher()
  }
}

// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import UIKit

class DevMenuMotionInterceptor {
  /**
   Returns bool value whether the dev menu shake gestures are being intercepted.
   */
  static var isInstalled: Bool = false {
    willSet {
      if isInstalled != newValue {
        // Capture shake gesture from any window by swizzling default implementation from UIWindow.
        swizzle()
      }
    }
  }

  static var isEnabled: Bool = true

  static private func swizzle() {
    DevMenuUtils.swizzle(
      selector: #selector(UIWindow.motionEnded(_:with:)),
      withSelector: #selector(UIWindow.EXDevMenu_motionEnded(_:with:)),
      forClass: UIWindow.self
    )
  }
}

extension UIWindow {
  @objc
  func EXDevMenu_motionEnded(_ motion: UIEvent.EventSubtype, with event: UIEvent?) {
    if event?.subtype == .motionShake && DevMenuMotionInterceptor.isEnabled {
      DevMenuManager.shared.toggleMenu()
    }
  }
}

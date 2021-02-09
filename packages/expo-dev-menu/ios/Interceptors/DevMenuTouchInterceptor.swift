// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import UIKit

class DevMenuTouchInterceptor {
  static fileprivate let recognizer: DevMenuGestureRecognizer = DevMenuGestureRecognizer()

  /**
   Returns bool value whether the dev menu touch gestures are being intercepted.
   */
  static var isInstalled: Bool = false {
    willSet {
      if isInstalled != newValue {
        // Capture touch gesture from any window by swizzling default implementation from UIWindow.
        swizzle()

        // Make sure recognizer is enabled/disabled accordingly.
        recognizer.isEnabled = newValue
      }
    }
  }

  static private func swizzle() {
    DevMenuUtils.swizzle(
      selector: #selector(getter: UIWindow.gestureRecognizers),
      withSelector: #selector(getter: UIWindow.EXDevMenu_gestureRecognizers),
      forClass: UIWindow.self
    )
  }
}

extension UIWindow {
  @objc open var EXDevMenu_gestureRecognizers: [UIGestureRecognizer]? {
    // Just for thread safety, someone may uninstall the interceptor in the meantime and we would fall into recursive loop.
    if !DevMenuTouchInterceptor.isInstalled {
      return self.gestureRecognizers
    }

    // Check for the case where singleton instance of gesture recognizer is not created yet or is attached to different window.
    let recognizer = DevMenuTouchInterceptor.recognizer
    if recognizer.view != self {
      // Remove it from the window it's attached to.
      recognizer.view?.removeGestureRecognizer(recognizer)

      // Attach to this window.
      self.addGestureRecognizer(recognizer)
    }

    // `EXDevMenu_gestureRecognizers` implementation has been swizzled with `gestureRecognizers` - it might be confusing that we call it recursively, but we don't.
    return self.EXDevMenu_gestureRecognizers
  }
}

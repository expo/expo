// Copyright 2018-present 650 Industries. All rights reserved.

internal import React

/**
 Root view controller that applies the status bar state set from JavaScript.
 */
open class ExpoRootViewController: UIViewController {
#if os(iOS)
  open override var preferredStatusBarStyle: UIStatusBarStyle {
    return RCTStatusBarAppearance.style
  }

  open override var prefersStatusBarHidden: Bool {
    return RCTStatusBarAppearance.hidden
  }

  open override var preferredStatusBarUpdateAnimation: UIStatusBarAnimation {
    return RCTStatusBarAppearance.updateAnimation
  }
#endif
}

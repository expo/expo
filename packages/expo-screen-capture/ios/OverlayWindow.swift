// Copyright 2026-present 650 Industries. All rights reserved.

import UIKit

/// UIKit hosts a presented view controller in a sibling of the root view, so no subview of the
/// root view can cover it.
internal final class OverlayWindow {
  let window: UIWindow
  private let rootViewController = UIViewController()

  var contentView: UIView {
    return rootViewController.view
  }

  init(above keyWindow: UIWindow) {
    if let scene = keyWindow.windowScene {
      window = UIWindow(windowScene: scene)
    } else {
      window = UIWindow(frame: keyWindow.frame)
    }
    window.frame = keyWindow.frame
    window.windowLevel = .alert + 1
    window.rootViewController = rootViewController
    window.isHidden = false
  }

  func dismiss() {
    window.isHidden = true
  }
}

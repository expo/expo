// Copyright 2026-present 650 Industries. All rights reserved.

import UIKit

/**
 Hides a window from screenshots by re-parenting its layer into the canvas layer of a
 secure-entry `UITextField`. The init either fully attaches the canvas or fails without
 mutating the layer hierarchy. Main thread only.
 */
internal final class SecureWindowCanvas {
  private let textField: UITextField
  private let originalParent: CALayer
  private(set) weak var window: UIWindow?

  init?(protecting window: UIWindow) {
    guard let originalParent = window.layer.superlayer else {
      return nil
    }

    let textField = UITextField()
    textField.isSecureTextEntry = true
    textField.isUserInteractionEnabled = false
    textField.backgroundColor = .clear
    textField.frame = UIScreen.main.bounds

    originalParent.addSublayer(textField.layer)

    guard let canvasLayer = textField.layer.sublayers?.first else {
      textField.layer.removeFromSuperlayer()
      return nil
    }

    Self.reparent(window, into: canvasLayer)

    self.textField = textField
    self.originalParent = originalParent
    self.window = window
  }

  func restore() {
    defer {
      textField.layer.removeFromSuperlayer()
    }
    guard let window else {
      return
    }
    Self.reparent(window, into: originalParent)
  }

  /**
   Re-parenting drops pending display work on `drawRect`-backed views (for example
   `react-native-svg` surfaces), leaving them blank until the next display pass. Complete
   pending draws first so nothing is in flight, and re-issue display work once the commit
   containing the re-parent lands, covering draws scheduled later in the same turn.
   */
  private static func reparent(_ window: UIWindow, into parent: CALayer) {
    displayPendingDraws(in: window.layer)
    window.layer.removeFromSuperlayer()
    parent.addSublayer(window.layer)
    CATransaction.setCompletionBlock { [weak window] in
      window.map { setNeedsDisplayRecursively(in: $0) }
    }
  }

  // `displayIfNeeded` is not recursive; walk the subtree so dirty descendants display too.
  private static func displayPendingDraws(in layer: CALayer) {
    layer.displayIfNeeded()
    layer.sublayers?.forEach { displayPendingDraws(in: $0) }
  }

  private static func setNeedsDisplayRecursively(in view: UIView) {
    view.setNeedsDisplay()
    for subview in view.subviews {
      setNeedsDisplayRecursively(in: subview)
    }
  }
}

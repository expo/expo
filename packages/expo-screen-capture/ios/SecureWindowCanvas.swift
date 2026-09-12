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

    window.layer.removeFromSuperlayer()
    canvasLayer.addSublayer(window.layer)

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
    window.layer.removeFromSuperlayer()
    originalParent.addSublayer(window.layer)
  }
}

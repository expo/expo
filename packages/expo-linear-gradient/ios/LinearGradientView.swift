// Copyright 2021-present 650 Industries. All rights reserved.

#if !os(macOS)
import UIKit
#endif
import ExpoModulesCore

final class LinearGradientView: ExpoView {
  #if !os(macOS)
  override class var layerClass: AnyClass {
    return LinearGradientLayer.self
  }
  #else
  override func makeBackingLayer() -> CALayer {
    return LinearGradientLayer()
  }
  #endif

  public var gradientLayer: LinearGradientLayer {
    return layer as! LinearGradientLayer
  }

  #if !os(macOS)
  override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
    super.traitCollectionDidChange(previousTraitCollection)
    layer.setNeedsDisplay()
  }
  #else
  override func viewDidChangeEffectiveAppearance() {
    super.viewDidChangeEffectiveAppearance()
    layer?.setNeedsDisplay()
  }
  #endif
}

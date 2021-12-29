// Copyright 2021-present 650 Industries. All rights reserved.

import UIKit
import ExpoModulesCore

final class LinearGradientView: UIView {
  override class var layerClass: AnyClass {
    return LinearGradientLayer.self
  }

  public var gradientLayer: LinearGradientLayer {
    return layer as! LinearGradientLayer
  }

  @Event
  public var onTest: Callback<String>

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    onTest("dupa")
  }
}

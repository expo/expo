// Copyright 2021-present 650 Industries. All rights reserved.

import UIKit

final class LinearGradientView: UIView {
  override class var layerClass: AnyClass {
    return LinearGradientLayer.self
  }

  public var gradientLayer: LinearGradientLayer {
    return layer as! LinearGradientLayer
  }
}

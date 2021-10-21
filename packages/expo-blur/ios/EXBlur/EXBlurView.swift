// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit

@objc public class EXBlurView : UIView
{
  @objc public var tint: String {
    didSet {
      blurEffectView.effect = UIBlurEffect(style: blurEffectStyleFrom(tint: tint))
    }
  }
  /**
   * Between 1 and 100
   */

  @objc public var intensity: Int {
    didSet {
      blurEffectView.alpha = CGFloat(intensity) / 100
    }
  }

  private let blurEffectView = UIVisualEffectView()

  override init(frame: CGRect) {
    self.tint = "default"
    self.intensity = 50
    super.init(frame: frame)

    blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    clipsToBounds = true

    addSubview(blurEffectView)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  private func blurEffectStyleFrom(tint: String) -> UIBlurEffect.Style {
    switch (tint) {
    case "light": return .extraLight
    case "dark": return .dark
    case "default": return .light
    default: return .dark
    }
  }

}

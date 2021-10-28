// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit

@objc
public class EXBlurView : UIView
{
  private var blurEffectView: EXBlurEffectView

  override init(frame: CGRect) {
    blurEffectView = EXBlurEffectView()
    super.init(frame: frame)

    blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    clipsToBounds = true

    addSubview(blurEffectView)
  }

  required init?(coder: NSCoder) { nil }

  @objc public func setTint(_ tint: String) {
    blurEffectView.tint = tint
  }

  @objc public func setIntensity(_ intensity: Float) {
    blurEffectView.intensity = intensity;
  }
}

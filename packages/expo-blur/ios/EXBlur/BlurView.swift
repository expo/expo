// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit
import ExpoModulesCore

@objc(EXBlurView)
public class BlurView: ExpoView {
  private var blurEffectView: BlurEffectView

  override init(frame: CGRect) {
    blurEffectView = BlurEffectView()
    super.init(frame: frame)

    blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    clipsToBounds = true

    addSubview(blurEffectView)
  }

  required init?(coder: NSCoder) { nil }

  @objc
  public func setTint(_ tint: String) {
    blurEffectView.tint = tint
  }

  @objc
  public func setIntensity(_ intensity: Double) {
    blurEffectView.intensity = intensity
  }
}

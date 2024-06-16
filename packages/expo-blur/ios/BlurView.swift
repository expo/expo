// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class BlurView: ExpoView {
  private let blurEffectView = BlurEffectView()

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    clipsToBounds = true

    addSubview(blurEffectView)
  }

  public func setTint(_ tint: TintStyle) {
    blurEffectView.tint = tint
  }

  public func setIntensity(_ intensity: Double) {
    blurEffectView.intensity = intensity
  }
}

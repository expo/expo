// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

@ViewProps
public struct BlurViewProps {
  var tint: TintStyle = .default
  /// The blur intensity from 0 to 100.
  var intensity: Double = 50
}

@ExpoView<BlurViewProps>
public final class ExpoBlurView: ExpoNativeView {
  private let blurEffectView = BlurEffectView()

  public override init(frame: CGRect) {
    super.init(frame: frame)

    blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    clipsToBounds = true

    addSubview(blurEffectView)
  }

  public func didUpdateProps(_ diff: BlurViewProps.Diff) {
    if diff.changed(.tint) {
      blurEffectView.tint = props.tint
    }
    if diff.changed(.intensity) {
      blurEffectView.intensity = props.intensity / 100
    }
  }
}

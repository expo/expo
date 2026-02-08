// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import React

public final class ExpoBlurView: ExpoView {
  private let blurEffectView = BlurEffectView()
  
  // border radius properties
  private var radius: CGFloat?
  private var bottomLeftRadius: CGFloat?
  private var bottomRightRadius: CGFloat?
  private var topLeftRadius: CGFloat?
  private var topRightRadius: CGFloat?
  private var bottomStartRadius: CGFloat?
  private var bottomEndRadius: CGFloat?
  private var topStartRadius: CGFloat?
  private var topEndRadius: CGFloat?

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    blurEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    clipsToBounds = true

    addSubview(blurEffectView)
  }

  public func updateBorderRadius() {
    if #available(iOS 26.0, *) {
      #if compiler(>=6.2) // Xcode 26
      let isRTL = RCTI18nUtil.sharedInstance()?.isRTL() ?? false

      let finalTopLeft: CGFloat
      let finalTopRight: CGFloat
      let finalBottomLeft: CGFloat
      let finalBottomRight: CGFloat

      if isRTL {
        finalTopLeft = topLeftRadius ?? topEndRadius ?? radius ?? 0
        finalTopRight = topRightRadius ?? topStartRadius ?? radius ?? 0
        finalBottomLeft = bottomLeftRadius ?? bottomEndRadius ?? radius ?? 0
        finalBottomRight = bottomRightRadius ?? bottomStartRadius ?? radius ?? 0
      } else {
        finalTopLeft = topLeftRadius ?? topStartRadius ?? radius ?? 0
        finalTopRight = topRightRadius ?? topEndRadius ?? radius ?? 0
        finalBottomLeft = bottomLeftRadius ?? bottomStartRadius ?? radius ?? 0
        finalBottomRight = bottomRightRadius ?? bottomEndRadius ?? radius ?? 0
      }

      let topLeft = UICornerRadius(floatLiteral: finalTopLeft)
      let topRight = UICornerRadius(floatLiteral: finalTopRight)
      let bottomLeft = UICornerRadius(floatLiteral: finalBottomLeft)
      let bottomRight = UICornerRadius(floatLiteral: finalBottomRight)

      blurEffectView.cornerConfiguration = .corners(
        topLeftRadius: topLeft,
        topRightRadius: topRight,
        bottomLeftRadius: bottomLeft,
        bottomRightRadius: bottomRight
      )
      #endif
    } else {
      // Fallback to layer.cornerRadius for < iOS 26
      blurEffectView.layer.cornerRadius = radius ?? 0
    }
  }

  public func setTint(_ tint: TintStyle) {
    blurEffectView.tint = tint
  }

  public func setIntensity(_ intensity: Double) {
    blurEffectView.intensity = intensity
  }
  
  public func setBorderCurve(_: String?) {
    blurEffectView.layer.cornerCurve = self.layer.cornerCurve
  }

  public func setBorderRadius(_ radius: CGFloat?) {
    self.radius = radius
    updateBorderRadius()
  }

  public func setBorderBottomLeftRadius(_ radius: CGFloat?) {
    self.bottomLeftRadius = radius
    updateBorderRadius()
  }

  public func setBorderBottomRightRadius(_ radius: CGFloat?) {
    self.bottomRightRadius = radius
    updateBorderRadius()
  }

  public func setBorderTopLeftRadius(_ radius: CGFloat?) {
    self.topLeftRadius = radius
    updateBorderRadius()
  }

  public func setBorderTopRightRadius(_ radius: CGFloat?) {
    self.topRightRadius = radius
    updateBorderRadius()
  }

  public func setBorderBottomStartRadius(_ radius: CGFloat?) {
    self.bottomStartRadius = radius
    updateBorderRadius()
  }

  public func setBorderBottomEndRadius(_ radius: CGFloat?) {
    self.bottomEndRadius = radius
    updateBorderRadius()
  }

  public func setBorderTopStartRadius(_ radius: CGFloat?) {
    self.topStartRadius = radius
    updateBorderRadius()
  }

  public func setBorderTopEndRadius(_ radius: CGFloat?) {
    self.topEndRadius = radius
    updateBorderRadius()
  }
}

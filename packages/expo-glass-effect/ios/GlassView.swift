// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore
import React

public final class GlassView: ExpoView {
  private var glassEffect: Any?
  private var glassEffectView = UIVisualEffectView()

  private var glassStyle: GlassStyle?
  private var glassTintColor: UIColor?
  private var glassIsInteractive: Bool?

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

    glassEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    addSubview(glassEffectView)
  }

  // UIGlassEffect initialiser is crashing for iOS 26 beta versions for some reason, so we need to check if it's available at runtime
  // https://github.com/expo/expo/issues/40911
  private func isGlassEffectAvailable() -> Bool {
    #if compiler(>=6.2)
    if #available(iOS 26.0, tvOS 26.0, macOS 26.0, *) {
      guard let glassEffectClass = NSClassFromString("UIGlassEffect") as? NSObject.Type else {
        return false
      }
      let respondsToSelector = glassEffectClass.responds(to: Selector(("effectWithStyle:")))
      return respondsToSelector
    }
    #endif
    return false
  }

  public func updateBorderRadius() {
    guard isGlassEffectAvailable() else {
      return
    }
    if #available(iOS 26.0, tvOS 26.0, macOS 26.0, *) {
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

      glassEffectView.cornerConfiguration = .corners(
        topLeftRadius: topLeft,
        topRightRadius: topRight,
        bottomLeftRadius: bottomLeft,
        bottomRightRadius: bottomRight
      )
      #endif
    }
  }

  public func setGlassStyle(_ style: GlassStyle) {
    if glassStyle != style {
      glassStyle = style
      guard isGlassEffectAvailable() else {
        return
      }
      if #available(iOS 26.0, tvOS 26.0, macOS 26.0, *) {
      #if compiler(>=6.2) // Xcode 26
        let effect = UIGlassEffect(style: glassStyle?.toUIGlassEffectStyle() ?? .regular)
        glassEffectView.effect = effect
        glassEffect = effect
        updateEffect()
        #endif
      }
    }
  }

  // TODO: support UIVisualEffectView with ExpoFabricView?
  public func setBorderRadius(_ _radius: CGFloat?) {
    if _radius != radius {
      radius = _radius
      updateBorderRadius()
    }
  }
  public func setBorderCurve(_: String?) {
    glassEffectView.layer.cornerCurve = self.layer.cornerCurve
  }

  public func setBorderBottomLeftRadius(_ radius: CGFloat?) {
    if radius != bottomLeftRadius {
      bottomLeftRadius = radius
      updateBorderRadius()
    }
  }

  public func setBorderBottomRightRadius(_ radius: CGFloat?) {
    if radius != bottomRightRadius {
      bottomRightRadius = radius
      updateBorderRadius()
    }
  }

  public func setBorderTopLeftRadius(_ radius: CGFloat?) {
    if radius != topLeftRadius {
      topLeftRadius = radius
      updateBorderRadius()
    }
  }

  public func setBorderTopRightRadius(_ radius: CGFloat?) {
    if radius != topRightRadius {
      topRightRadius = radius
      updateBorderRadius()
    }
  }

  public func setBorderBottomStartRadius(_ radius: CGFloat?) {
    if radius != bottomStartRadius {
      bottomStartRadius = radius
      updateBorderRadius()
    }
  }

  public func setBorderBottomEndRadius(_ radius: CGFloat?) {
    if radius != bottomEndRadius {
      bottomEndRadius = radius
      updateBorderRadius()
    }
  }

  public func setBorderTopStartRadius(_ radius: CGFloat?) {
    if radius != topStartRadius {
      topStartRadius = radius
      updateBorderRadius()
    }
  }

  public func setBorderTopEndRadius(_ radius: CGFloat?) {
    if radius != topEndRadius {
      topEndRadius = radius
      updateBorderRadius()
    }
  }

  public func setTintColor(_ color: UIColor?) {
    if color != glassTintColor {
      glassTintColor = color
      updateEffect()
    }
  }

  public func setInteractive(_ interactive: Bool) {
    if interactive != glassIsInteractive {
      glassIsInteractive = interactive
      updateEffect()
    }
  }

  func setColorScheme(_ colorScheme: GlassColorScheme) {
    overrideUserInterfaceStyle = colorScheme.toUIUserInterfaceStyle()
  }

  private func updateEffect() {
    guard isGlassEffectAvailable() else {
      return
    }
    if #available(iOS 26.0, tvOS 26.0, macOS 26.0, *) {
      #if compiler(>=6.2) // Xcode 26
      if let effect = glassEffect as? UIGlassEffect {
        effect.tintColor = glassTintColor
        effect.isInteractive = glassIsInteractive ?? false
        // we need to set the effect again or it has no effect!
        glassEffectView.effect = effect
        updateBorderRadius()
        setBorderCurve(nil)
      }
      #endif
    }
  }
  public override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    glassEffectView.contentView.insertSubview(childComponentView, at: index)
  }

  public override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    childComponentView.removeFromSuperview()
  }
}

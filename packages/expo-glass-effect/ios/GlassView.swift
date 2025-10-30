// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

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

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    glassEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    addSubview(glassEffectView)
  }

  public func updateBorderRadius() {
    if #available(iOS 26.0, *) {
      #if compiler(>=6.2) // Xcode 26
      let topLeft = UICornerRadius(floatLiteral: topLeftRadius ?? radius ?? 0)
      let topRight = UICornerRadius(floatLiteral: topRightRadius ?? radius ?? 0)
      let bottomLeft = UICornerRadius(floatLiteral: bottomLeftRadius ?? radius ?? 0)
      let bottomRight = UICornerRadius(floatLiteral: bottomRightRadius ?? radius ?? 0)
      
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
      if #available(iOS 26.0, *) {
        #if compiler(>=6.2) // Xcode 26
        let effect = UIGlassEffect(style: glassStyle?.toUIGlassEffectStyle() ?? .regular)
        glassEffectView.effect = effect
        glassEffect = effect
        #endif
      }
      updateEffect()
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

  private func updateEffect() {
    if #available(iOS 26.0, *) {
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

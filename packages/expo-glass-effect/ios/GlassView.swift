// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class GlassView: ExpoView {
  private var glassEffect: Any?
  private var glassEffectView = UIVisualEffectView()

  private var glassStyle: GlassStyle?
  private var glassTintColor: UIColor?
  private var glassIsInteractive: Bool?

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    glassEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    addSubview(glassEffectView)
  }

  public func setGlassStyle(_ style: GlassStyle) {
    if glassStyle != style {
      glassStyle = style
      if #available(iOS 26.0, *) {
        let effect = UIGlassEffect(style: glassStyle?.toUIGlassEffectStyle() ?? .regular)
        glassEffectView.effect = effect
        glassEffect = effect
      }
      updateEffect()
    }
  }

  // Nested GlassContainer GlassView do not respect parent layer corner properties, so we copy it here
  // Non uniform borders also do not work as GlassView does not respect mask property when nested in a GlassContainer
  // TODO: support UIVisualEffectView with ExpoFabricView?
  public func setBorderRadius(_: CGFloat?) {
    glassEffectView.layer.cornerRadius = self.layer.cornerRadius
  }
  public func setBorderCurve(_: String?) {
    glassEffectView.layer.cornerCurve = self.layer.cornerCurve
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
      if let effect = glassEffect as? UIGlassEffect {
        effect.tintColor = glassTintColor
        effect.isInteractive = glassIsInteractive ?? false
        // we need to set the effect again or it has no effect!
        glassEffectView.effect = effect
        setBorderRadius(nil)
        setBorderCurve(nil)
      }
    }
  }
}

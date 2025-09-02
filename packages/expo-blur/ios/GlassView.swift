// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class GlassView: ExpoView {
  private var glassEffectView = UIVisualEffectView()
  private var glassStyle: GlassStyle?
  private var glassTintColor: UIColor?
  private var glassIsInteractive: Bool?
  
  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    
    glassEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    clipsToBounds = true
    
    addSubview(glassEffectView)
  }
  
  public func setGlassStyle(_ style: GlassStyle) {
    glassStyle = style
  }

  public func setTintColor(_ color: UIColor?) {
    glassTintColor = color
  }
  
  public func setInteractive(_ interactive: Bool) {
    glassIsInteractive = interactive
  }
  
  public func updateEffect() {
      if #available(iOS 26.0, *) {
        let effect = UIGlassEffect(style: glassStyle?.toUIGlassEffectStyle() ?? .regular)
          effect.tintColor = glassTintColor
          effect.isInteractive = glassIsInteractive ?? false
          glassEffectView.effect = effect
      }
  }
}


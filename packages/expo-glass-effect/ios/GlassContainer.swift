// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class GlassContainer: ExpoView {
  private var containerEffect: Any?
  private var containerEffectView = UIVisualEffectView()

  private var containerSpacing: CGFloat?

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    containerEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    addSubview(containerEffectView)
  }

  // UIGlassEffect initialiser is failing for iOS 26 beta versions for some reason, so we need to check if it's available at runtime
  // https://github.com/expo/expo/issues/40911
  private func isGlassContainerEffectAvailable() -> Bool {
    #if compiler(>=6.2)
    if #available(iOS 26.0, *) {
      return NSClassFromString("UIGlassContainerEffect") != nil
    }
    #endif
    return false
  }

  public func setSpacing(_ spacing: CGFloat?) {
    if containerSpacing != spacing {
      containerSpacing = spacing
      guard isGlassContainerEffectAvailable() else {
        return
      }
      if #available(iOS 26.0, *) {
        #if compiler(>=6.2) // Xcode 26
        let effect = UIGlassContainerEffect()
        if let spacing = spacing {
          effect.spacing = spacing
        }
        containerEffectView.effect = effect
        containerEffect = effect
        #endif
      }
    }
  }

  public override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    containerEffectView.contentView.insertSubview(childComponentView, at: index)
  }

  public override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    childComponentView.removeFromSuperview()
  }
}

// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class GlassContainer: ExpoView {
  private var containerEffect: Any?
  private var containerEffectView = UIVisualEffectView()

  private var containerSpacing: CGFloat?

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    containerEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    clipsToBounds = true

    addSubview(containerEffectView)
  }

  public func setSpacing(_ spacing: CGFloat?) {
    if containerSpacing != spacing {
      containerSpacing = spacing
      if #available(iOS 26.0, *) {
        let effect = UIGlassContainerEffect()
        if let spacing = spacing {
          effect.spacing = spacing
        }
        containerEffectView.effect = effect
        containerEffect = effect
      }
      updateEffect()
    }
  }

  private func updateEffect() {
    if #available(iOS 26.0, *) {
      if let effect = containerEffect as? UIGlassContainerEffect {
        containerEffectView.effect = effect
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

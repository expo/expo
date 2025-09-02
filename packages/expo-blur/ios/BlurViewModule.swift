// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class BlurViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlurView")

    View(BlurView.self) {
      Prop("tint") { (view, tint: TintStyle) in
        view.setTint(tint)
      }

      Prop("intensity") { (view, intensity: Double) in
        view.setIntensity(intensity / 100)
      }
    }

    View(GlassView.self) {
      Prop("glassEffectStyle") { (view, style: GlassStyle) in
        view.setGlassStyle(style)
      }

      Prop("tintColor") { (view, tintColor: UIColor?) in
        view.setTintColor(tintColor)
      }

      Prop("isInteractive") { (view, interactive: Bool) in
        view.setInteractive(interactive)
      }
    }
  }
}

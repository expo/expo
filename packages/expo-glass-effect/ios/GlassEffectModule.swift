// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class GlassEffectModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoGlassEffect")

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

      Prop("borderRadius") { (view, border: CGFloat?) in
        view.setBorderRadius(border)
      }

      Prop("borderCurve") { (view, curve: String?) in
        view.setBorderCurve(curve)
      }
    }

    View(GlassContainer.self) {
      Prop("spacing") { (view, spacing: CGFloat?) in
        view.setSpacing(spacing)
      }
    }
  }
}

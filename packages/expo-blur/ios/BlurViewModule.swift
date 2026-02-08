// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class BlurViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlur")

    View(ExpoBlurView.self) {
      Prop("tint") { (view, tint: TintStyle) in
        view.setTint(tint)
      }

      Prop("intensity") { (view, intensity: Double) in
        view.setIntensity(intensity / 100)
      }

      Prop("borderRadius") { (view, radius: CGFloat?) in
        view.setBorderRadius(radius)
      }

      Prop("borderBottomLeftRadius") { (view, radius: CGFloat?) in
        view.setBorderBottomLeftRadius(radius)
      }

      Prop("borderBottomRightRadius") { (view, radius: CGFloat?) in
        view.setBorderBottomRightRadius(radius)
      }

      Prop("borderTopLeftRadius") { (view, radius: CGFloat?) in
        view.setBorderTopLeftRadius(radius)
      }

      Prop("borderTopRightRadius") { (view, radius: CGFloat?) in
        view.setBorderTopRightRadius(radius)
      }

      Prop("borderTopStartRadius") { (view, radius: CGFloat?) in
        view.setBorderTopStartRadius(radius)
      }

      Prop("borderTopEndRadius") { (view, radius: CGFloat?) in
        view.setBorderTopEndRadius(radius)
      }

      Prop("borderBottomStartRadius") { (view, radius: CGFloat?) in
        view.setBorderBottomStartRadius(radius)
      }

      Prop("borderBottomEndRadius") { (view, radius: CGFloat?) in
        view.setBorderBottomEndRadius(radius)
      }

      Prop("borderCurve") { (view, curve: String?) in
        view.setBorderCurve(curve)
      }
    }
  }
}

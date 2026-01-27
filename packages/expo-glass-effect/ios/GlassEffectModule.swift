// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class GlassEffectModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoGlassEffect")

    Constant("isLiquidGlassAvailable") {
      #if compiler(>=6.2)  // Xcode 26
      if #available(iOS 26.0, tvOS 26.0, macOS 26.0, *) {  // iOS 26
        if let infoPlist = Bundle.main.infoDictionary,
          let requiresCompatibility = infoPlist["UIDesignRequiresCompatibility"] as? Bool {
          // TODO(@uabx): Add a check for maximum SDK version when apple disables this flag
          return !requiresCompatibility  // If the app requires compatibility then it will not use liquid glass
        }
        return true
      }
      #endif
      return false
    }

    Constant("isGlassEffectAPIAvailable") {
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

    View(GlassView.self) {
      Prop("glassEffectStyle", .regular) { (view, style: GlassStyle) in
        view.setGlassStyle(style)
      }

      Prop("tintColor") { (view, tintColor: UIColor?) in
        view.setTintColor(tintColor)
      }

      Prop("isInteractive") { (view, interactive: Bool) in
        view.setInteractive(interactive)
      }

      Prop("colorScheme", .auto) { (view, colorScheme: GlassColorScheme) in
        view.setColorScheme(colorScheme)
      }

      Prop("borderRadius") { (view, border: CGFloat?) in
        view.setBorderRadius(border)
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

    View(GlassContainer.self) {
      Prop("spacing") { (view, spacing: CGFloat?) in
        view.setSpacing(spacing)
      }
    }
  }
}

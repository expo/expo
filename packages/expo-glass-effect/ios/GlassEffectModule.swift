// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class GlassEffectModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoGlassEffect")

    Constant("isLiquidGlassAvailable") {
      #if compiler(>=6.2)  // Xcode 26
      if #available(iOS 26.0, tvOS 26.0, macOS 26.0, *) {  // iOS 26
        // The system ignores `UIDesignRequiresCompatibility` in apps built with the iOS 27 SDK, so
        // for those the opt-out below no longer describes what the app renders.
        if #available(iOS 27.0, tvOS 27.0, macOS 27.0, *), buildSDKMajorVersion() >= 27 {  // iOS 27
          return true
        }
        if let infoPlist = Bundle.main.infoDictionary,
          let requiresCompatibility = infoPlist["UIDesignRequiresCompatibility"] as? Bool {
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
      Prop("glassEffectStyle") { (view, config: Either<GlassStyle, GlassEffectStyleConfig>?) in
        if let styleConfig: GlassEffectStyleConfig = config?.get() {
          view.setGlassStyle(styleConfig)
        } else if let style: GlassStyle = config?.get() {
          view.setGlassStyle(style)
        } else {
          view.setGlassStyle(.regular)
        }
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

/**
 Major version of the SDK the app was built with, read from the `DTPlatformVersion` that Xcode
 stamps into the app's Info.plist. Returns 0 for a bundle Xcode didn't stamp, so callers fall back
 to the behavior of the older SDK.

 Read at runtime rather than through `#if compiler(...)` because the Swift version and the SDK
 version don't move together: Xcode 26.6 already ships Swift 6.3.
 */
private func buildSDKMajorVersion() -> Int {
  guard let platformVersion = Bundle.main.infoDictionary?["DTPlatformVersion"] as? String,
    let major = Int(platformVersion.prefix { $0.isNumber }) else {
    return 0
  }
  return major
}

// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class BlurViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBlurView")

    View(BlurView.self) {
      Prop("tint") { (view, tint: String) in
        view.setTint(tint)
      }

      Prop("intensity") { (view, intensity: Double) in
        view.setIntensity(intensity / 100)
      }
      
      Prop("vibrancy") { (view, vibrancy: String) in
        view.setVibrancy(vibrancy)
      }
    }

    AsyncFunction("setNativeProps") { (props: [String: Any], viewTag: Int) in
      guard let view = appContext?.findView(withTag: viewTag, ofType: BlurView.self) else {
        throw Exceptions.ViewNotFound((tag: viewTag, type: BlurView.self))
      }
      if let tint = props["tint"] as? String {
        view.setTint(tint)
      }
      if let intensity = props["intensity"] as? Double {
        view.setIntensity(intensity / 100)
      }                              
      if let vibrancy = props["vibrancy"] as? String {
        view.setVibrancy(vibrancy)
      }
    }
    .runOnQueue(.main)
  }
}

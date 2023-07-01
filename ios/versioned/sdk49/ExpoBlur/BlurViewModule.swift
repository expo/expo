// Copyright 2022-present 650 Industries. All rights reserved.

import ABI49_0_0ExpoModulesCore

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
    }
  }
}

// Copyright 2022-present 650 Industries. All rights reserved.

import ABI49_0_0ExpoModulesCore

public final class GLViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExponentGLView")

    View(ABI49_0_0EXGLView.self) {
      Events("onSurfaceCreate")

      Prop("msaaSamples") { (view, msaaSamples: Int) in
        view.msaaSamples = msaaSamples
      }
      Prop("enableExperimentalWorkletSupport") { (view, enableExperimentalWorkletSupport: Bool) in
        view.enableExperimentalWorkletSupport = enableExperimentalWorkletSupport
      }
    }
  }
}

// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class GLViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExponentGLView")

    View(EXGLView.self) {
      Events("onSurfaceCreate")

      Prop("msaaSamples") { (view, msaaSamples: Int) in
        view.msaaSamples = msaaSamples
      }
    }
  }
}

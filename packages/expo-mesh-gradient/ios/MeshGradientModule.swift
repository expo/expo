// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class MeshGradientModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoMeshGradient")

    View(MeshGradientView.self)
  }
}

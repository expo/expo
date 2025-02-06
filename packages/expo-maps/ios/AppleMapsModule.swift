// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class AppleMapsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoAppleMaps")

    Property("isMapsAvailable") {
      if #available(iOS 18.0, *) {
        return true
      }
      return false
    }

    View(AppleMapsViewWrapper.self) {
      AsyncFunction("setCameraPosition") { (view: AppleMapsViewWrapper, config: Double) in
        view.setCameraPosition(config: config)
      }
    }
  }
}

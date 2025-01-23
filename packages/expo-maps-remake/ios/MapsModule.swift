// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class MapsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoMapsRemake")

    Property("isMapsAvailable") {
      if #available(iOS 18.0, *) {
        return true
      }
      return false
    }

    View(AppleMapsViewWrapper.self)
  }
}

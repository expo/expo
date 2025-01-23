// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class MapsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoMapsRemake")
    
    View(AppleMapsViewWrapper.self)
  }
}

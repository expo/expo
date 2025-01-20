// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class ExpoUIModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoUI")

    View(SingleChoiceSegmentedControlView.self)
    View(SliderView.self)
  }
}

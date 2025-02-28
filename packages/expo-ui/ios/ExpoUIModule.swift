// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class ExpoUIModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoUI")
    View(Button.self)
    View(PickerView.self)
    View(SwitchView.self)
    View(SectionView.self)
    View(SliderView.self)
    View(ExpoUI.ContextMenu.self)
    View(ColorPickerView.self)
    View(DateTimePickerView.self)
    View(DisclosureGroupView.self)
    View(TextInputView.self)
    View(ProgressView.self)
    View(GaugeView.self)
  }
}

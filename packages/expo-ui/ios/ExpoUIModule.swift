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

    View(TextInputView.self)
//    View(ProgressView.self)
//    View(GaugeView.self)
    
    Class("StringValueBinding", ValueBinding<String>.self) {
      Constructor { (value: String) in
        return ValueBinding(value)
      }
      
      Function("get") { (binding: ValueBinding<String>) in
        return binding.value.wrappedValue
      }
      Function("set") { (binding: ValueBinding<String>, value: String) in
        DispatchQueue.main.async() {
          binding.value.wrappedValue = value
        }
      }
    }
  }
}
